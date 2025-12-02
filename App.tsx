
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { GroupHeader } from './components/GroupHeader';
import { NavigationTabs } from './components/NavigationTabs';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { MemberList } from './components/MemberList';
import { TimeTableView } from './components/TimeTableView';
import { TodoView } from './components/TodoView';
import { GroupCalendar } from './components/GroupCalendar';
import { LoginScreen } from './components/LoginScreen';
import { ConfigScreen } from './components/ConfigScreen';
import { TabType, Member, TimeTableItem, TodoItem, Group } from './types';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc, 
  onSnapshot, 
  collection, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

function App() {
  // --- STATE ---
  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [configMissing, setConfigMissing] = useState(false);

  // Auth & User
  const [myId, setMyId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>('');
  const [myAvatar, setMyAvatar] = useState<string>('');
  
  // App Data
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]); // Synced from DB
  
  const [activeTab, setActiveTab] = useState<TabType>(TabType.GROUP);
  const [isLocked, setIsLocked] = useState(false);
  
  const [members, setMembers] = useState<Member[]>([]);
  
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [todos, setTodos] = useState<Record<string, TodoItem[]>>({});
  const [timetables, setTimetables] = useState<Record<string, TimeTableItem[]>>({});

  const [timerSeconds, setTimerSeconds] = useState(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Check LocalStorage for Config
    const storedConfig = localStorage.getItem('sb_firebase_config');
    if (storedConfig) {
        try {
            const config = JSON.parse(storedConfig);
            if (!getApps().length) {
                const app = initializeApp(config);
                setFirebaseApp(app);
                setDb(getFirestore(app));
            } else {
                const app = getApp();
                setFirebaseApp(app);
                setDb(getFirestore(app));
            }
        } catch (e) {
            console.error("Firebase Init Error", e);
            setConfigMissing(true);
        }
    } else {
        setConfigMissing(true);
    }

    // 2. Restore User Session
    const storedId = localStorage.getItem('sb_user_id');
    const storedName = localStorage.getItem('sb_user_name');
    const storedAvatar = localStorage.getItem('sb_user_avatar');
    const storedActiveGroup = localStorage.getItem('sb_active_group');

    if (storedId && storedName && storedAvatar) {
        setMyId(storedId);
        setMyName(storedName);
        setMyAvatar(storedAvatar);
        if (storedActiveGroup) {
            setActiveGroupId(storedActiveGroup);
            setSelectedMemberId(storedId);
        }
    }
  }, []);

  const handleSaveConfig = (config: any) => {
    localStorage.setItem('sb_firebase_config', JSON.stringify(config));
    window.location.reload(); // Reload to init firebase
  };

  // --- REAL-TIME SYNC ---

  // 1. Sync Groups List (Ideally, a user only sees groups they joined. 
  // For simplicity, we just sync the CURRENT group doc if active)
  useEffect(() => {
    if (!db || !activeGroupId) return;

    // We can't easily query "all groups I'm in" without a user-groups collection.
    // So we will just fetch the current group details.
    const groupRef = doc(db, 'groups', activeGroupId);
    const unsub = onSnapshot(groupRef, (doc) => {
        if (doc.exists()) {
            // We put it in an array to fit current UI structure
            setGroups([{ id: doc.id, ...doc.data() } as Group]);
        }
    });
    return () => unsub();
  }, [db, activeGroupId]);


  // 2. Sync Members
  useEffect(() => {
    if (!db || !activeGroupId) return;
    const membersRef = collection(db, 'groups', activeGroupId, 'members');
    const unsub = onSnapshot(membersRef, (snapshot) => {
        const list: Member[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Member));
        setMembers(list);
    });
    return () => unsub();
  }, [db, activeGroupId]);

  // 3. Sync Timetables
  useEffect(() => {
      if (!db || !activeGroupId) return;
      const ttRef = collection(db, 'groups', activeGroupId, 'timetables');
      const unsub = onSnapshot(ttRef, (snapshot) => {
          const map: Record<string, TimeTableItem[]> = {};
          snapshot.forEach((doc) => {
             const data = doc.data();
             const uid = data.userId;
             if (!map[uid]) map[uid] = [];
             map[uid].push({ id: doc.id, ...data } as TimeTableItem);
          });
          setTimetables(map);
      });
      return () => unsub();
  }, [db, activeGroupId]);

  // 4. Sync Todos
  useEffect(() => {
    if (!db || !activeGroupId) return;
    const todoRef = collection(db, 'groups', activeGroupId, 'todos');
    const unsub = onSnapshot(todoRef, (snapshot) => {
        const map: Record<string, TodoItem[]> = {};
        snapshot.forEach((doc) => {
           const data = doc.data();
           const uid = data.userId;
           if (!map[uid]) map[uid] = [];
           map[uid].push({ id: doc.id, ...data } as TodoItem);
        });
        setTodos(map);
    });
    return () => unsub();
}, [db, activeGroupId]);


  // --- LOGIC ---

  const currentGroupMembers = members;
  // If ANYONE is distracted, timer stops for everyone in the group logic
  const distractedMember = currentGroupMembers.find(m => m.status === 'distracted');
  // Timer runs only if there are members and no one is distracted
  const isTimerRunning = !distractedMember && currentGroupMembers.length > 0 && isLocked; // Local lock is also required to "participate"

  // Local timer effect (Just for visual, doesn't sync precise seconds to DB to save writes)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Wake Lock & Visibility
  useEffect(() => {
    const handleVisChange = () => {
        if (document.visibilityState === 'hidden' && isLocked) {
             toggleLock(true); // Force unlock with penalty
        }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => document.removeEventListener('visibilitychange', handleVisChange);
  }, [isLocked]);

  useEffect(() => {
    if (isLocked) {
        if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(l => { wakeLockRef.current = l; });
    } else {
        wakeLockRef.current?.release();
    }
  }, [isLocked]);


  // --- ACTIONS ---

  const handleLogin = async (name: string, groupName: string, avatarSeed: string) => {
      if (!db) return;
      
      const newUserId = myId || `user-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      
      // 1. Group Logic
      const groupRef = doc(db, 'groups', groupName);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
          // Create Group
          await setDoc(groupRef, {
              name: groupName,
              color: '#' + Math.floor(Math.random()*16777215).toString(16),
              createdAt: serverTimestamp()
          });
      }

      // 2. Member Join
      const memberRef = doc(db, 'groups', groupName, 'members', newUserId);
      await setDoc(memberRef, {
          id: newUserId,
          name: name,
          avatarSeed: avatarSeed,
          status: 'distracted', // Start distracted until they lock
          message: '입장함',
          groupId: groupName,
          joinedAt: serverTimestamp()
      }, { merge: true });

      // Local State
      setMyId(newUserId);
      setMyName(name);
      setMyAvatar(avatarSeed);
      setActiveGroupId(groupName);
      setSelectedMemberId(newUserId);

      localStorage.setItem('sb_user_id', newUserId);
      localStorage.setItem('sb_user_name', name);
      localStorage.setItem('sb_user_avatar', avatarSeed);
      localStorage.setItem('sb_active_group', groupName);
  };

  const toggleLock = async (forceUnlock = false) => {
      if (!db || !myId || !activeGroupId) return;

      let newLockedState = !isLocked;
      if (forceUnlock) newLockedState = false;

      setIsLocked(newLockedState);

      const memberRef = doc(db, 'groups', activeGroupId, 'members', myId);
      
      if (newLockedState) {
          // Locked -> FOCUS
          await updateDoc(memberRef, {
              status: 'focus',
              message: '🔥 열공중'
          });
      } else {
          // Unlocked -> DISTRACTED
          const apps = ['유튜브', '인스타', '카카오톡', '웹툰', '넷플릭스', '게임', '틱톡'];
          const randomApp = apps[Math.floor(Math.random() * apps.length)];
          const reason = forceUnlock ? `앱 이탈 감지됨 (${randomApp}?)` : `딴짓 감지됨 (${randomApp})`;
          
          await updateDoc(memberRef, {
              status: 'distracted',
              message: `🚨 ${reason}`
          });
      }
  };

  // --- CRUD (Timetable / Todo / Group) ---
  
  // TIMETABLE
  const handleAddTimetable = async (start: string, end: string, subj: string) => {
      if (!db || !activeGroupId || !myId) return;
      const ref = doc(collection(db, 'groups', activeGroupId, 'timetables'));
      await setDoc(ref, {
          userId: myId,
          startTime: start,
          endTime: end,
          subject: subj
      });
  };
  const handleUpdateTimetable = async (itemId: string, start: string, end: string, subj: string) => {
    if (!db || !activeGroupId) return;
    await updateDoc(doc(db, 'groups', activeGroupId, 'timetables', itemId), {
        startTime: start, endTime: end, subject: subj
    });
  };
  const handleDeleteTimetable = async (itemId: string) => {
    if (!db || !activeGroupId) return;
    await deleteDoc(doc(db, 'groups', activeGroupId, 'timetables', itemId));
  };

  // TODO
  const handleAddTodo = async (text: string) => {
    if (!db || !activeGroupId || !myId) return;
    const ref = doc(collection(db, 'groups', activeGroupId, 'todos'));
    await setDoc(ref, {
        userId: myId,
        text,
        completed: false
    });
  };
  const handleToggleTodo = async (uid: string, todoId: string) => {
     if (uid !== myId) return; 
     // We need to find current status. We have it in state 'todos'
     const item = todos[myId]?.find(t => t.id === todoId);
     if (item && db && activeGroupId) {
         await updateDoc(doc(db, 'groups', activeGroupId, 'todos', todoId), {
             completed: !item.completed
         });
     }
  };
  const handleUpdateTodo = async (id: string, text: string) => {
      if (!db || !activeGroupId) return;
      await updateDoc(doc(db, 'groups', activeGroupId, 'todos', id), { text });
  };
  const handleDeleteTodo = async (id: string) => {
      if (!db || !activeGroupId) return;
      await deleteDoc(doc(db, 'groups', activeGroupId, 'todos', id));
  };

  // GROUP Update (Rename)
  const handleUpdateGroup = async (id: string, name: string) => {
      // NOTE: Changing ID in firestore is hard. We just change display name field.
      // But our ID IS the name currently. 
      // For this simple app, we will just update the 'name' field, 
      // but keeping ID same means new users must join with OLD name.
      // Better to just update display props.
      if (!db) return;
      await updateDoc(doc(db, 'groups', id), { name });
  };
  const handleDeleteGroup = async (id: string) => {
      // Allow deleting group doc. Subcollections might persist but become orphaned in Firestore.
      if (!db) return;
      await deleteDoc(doc(db, 'groups', id));
      // Reset local state
      setActiveGroupId('');
      localStorage.removeItem('sb_active_group');
      window.location.reload();
  };


  // --- RENDER ---

  if (configMissing) {
      return <ConfigScreen onSaveConfig={handleSaveConfig} />;
  }

  if (!myId || !activeGroupId) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-md mx-auto">
      <Header />
      
      {activeTab === TabType.CALENDAR ? (
           <GroupCalendar groups={groups} />
      ) : (
           <GroupCalendar groups={groups} /> // Show condensed calendar on top? or separate? Request said separate tab.
           // Wait, request said "Calendar is a new tab". 
           // But previously "Calendar position ... moved to top".
           // Then "Calendar is new tab".
           // I will hide it here if activeTab is Calendar, show it inside main content.
      )}

      {activeTab !== TabType.CALENDAR && (
        <GroupHeader 
            groups={groups} 
            activeGroupId={activeGroupId}
            onSelectGroup={(id) => setActiveGroupId(id)} // Simple switch if we had multiple
            onCreateGroup={(name) => handleLogin(myName, name, myAvatar)} // Reuse login logic to join/create new
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
        />
      )}

      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {activeTab === TabType.GROUP && (
          <>
            <TimerDisplay 
              isRunning={isTimerRunning}
              distractedMemberName={distractedMember?.name}
              distractedMessage={distractedMember?.message}
              isMeDistracted={distractedMember?.id === myId}
              seconds={timerSeconds}
              onReset={() => setTimerSeconds(0)}
            />
            
            <Controls 
              isLocked={isLocked}
              toggleLock={() => toggleLock()}
            />

            <MemberList 
              members={members}
              onAddMember={() => {}} // Deprecated
              onRemoveMember={() => {}} // Logic complicated for realtime
              currentUserId={myId}
              groupName={activeGroupId}
            />
          </>
        )}

        {activeTab === TabType.CALENDAR && (
            <GroupCalendar groups={groups} />
        )}

        {activeTab === TabType.TIMETABLE && (
          <TimeTableView
            members={members}
            selectedMemberId={selectedMemberId}
            onSelectMember={setSelectedMemberId}
            timetables={timetables}
            onAdd={handleAddTimetable}
            onRemove={handleDeleteTimetable}
            onUpdate={handleUpdateTimetable}
            currentUserId={myId}
          />
        )}

        {activeTab === TabType.TODO && (
          <TodoView
            members={members}
            selectedMemberId={selectedMemberId}
            onSelectMember={setSelectedMemberId}
            todos={todos}
            onToggleTodo={handleToggleTodo}
            onAdd={handleAddTodo}
            onRemove={handleDeleteTodo}
            onUpdate={handleUpdateTodo}
            currentUserId={myId}
          />
        )}
      </main>
    </div>
  );
}

export default App;
