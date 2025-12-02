
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

  // --- FORCE RESET HANDLER ---
  const handleForceReset = () => {
    localStorage.removeItem('sb_firebase_config');
    window.location.reload();
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const storedConfig = localStorage.getItem('sb_firebase_config');
    if (storedConfig) {
        try {
            const config = JSON.parse(storedConfig);
            // Basic validation
            if (!config.apiKey || !config.projectId) throw new Error("Invalid Config");

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
            // Auto-wipe bad config and show screen
            localStorage.removeItem('sb_firebase_config');
            setConfigMissing(true);
        }
    } else {
        setConfigMissing(true);
    }

    // Restore User Session
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
    window.location.reload(); 
  };

  const handleResetConfig = () => {
     localStorage.removeItem('sb_firebase_config');
     window.location.reload();
  };

  // --- REAL-TIME SYNC ---

  useEffect(() => {
    if (!db || !activeGroupId) return;

    const groupRef = doc(db, 'groups', activeGroupId);
    const unsub = onSnapshot(groupRef, (doc) => {
        if (doc.exists()) {
            setGroups([{ id: doc.id, ...doc.data() } as Group]);
        }
    }, (error) => {
        console.error("Group Sync Error:", error);
        // If we get a permission/auth error, likely bad config. 
        // Force reset to config screen.
        localStorage.removeItem('sb_firebase_config');
        setConfigMissing(true);
    });
    return () => unsub();
  }, [db, activeGroupId]);


  useEffect(() => {
    if (!db || !activeGroupId) return;
    const membersRef = collection(db, 'groups', activeGroupId, 'members');
    const unsub = onSnapshot(membersRef, (snapshot) => {
        const list: Member[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Member));
        setMembers(list);
    }, (error) => {
         console.error("Member Sync Error:", error);
    });
    return () => unsub();
  }, [db, activeGroupId]);

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
  const distractedMember = currentGroupMembers.find(m => m.status === 'distracted');
  const isTimerRunning = !distractedMember && currentGroupMembers.length > 0 && isLocked;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    const handleVisChange = () => {
        if (document.visibilityState === 'hidden' && isLocked) {
             toggleLock(true); 
        }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => document.removeEventListener('visibilitychange', handleVisChange);
  }, [isLocked]);

  useEffect(() => {
    if (isLocked) {
        if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(l => { wakeLockRef.current = l; }).catch(() => {});
    } else {
        wakeLockRef.current?.release().catch(() => {});
    }
  }, [isLocked]);


  // --- ACTIONS ---

  const handleLogin = async (name: string, groupName: string, avatarSeed: string) => {
      if (!db) {
          // If DB is missing here, something is wrong with init. Force reset.
          handleForceReset();
          return;
      }
      
      try {
          const newUserId = myId || `user-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          
          const groupRef = doc(db, 'groups', groupName);
          const groupSnap = await getDoc(groupRef);
          
          if (!groupSnap.exists()) {
              await setDoc(groupRef, {
                  name: groupName,
                  color: '#' + Math.floor(Math.random()*16777215).toString(16),
                  createdAt: serverTimestamp()
              });
          }

          const memberRef = doc(db, 'groups', groupName, 'members', newUserId);
          await setDoc(memberRef, {
              id: newUserId,
              name: name,
              avatarSeed: avatarSeed,
              status: 'distracted', 
              message: '입장함',
              groupId: groupName,
              joinedAt: serverTimestamp()
          }, { merge: true });

          setMyId(newUserId);
          setMyName(name);
          setMyAvatar(avatarSeed);
          setActiveGroupId(groupName);
          setSelectedMemberId(newUserId);

          localStorage.setItem('sb_user_id', newUserId);
          localStorage.setItem('sb_user_name', name);
          localStorage.setItem('sb_user_avatar', avatarSeed);
          localStorage.setItem('sb_active_group', groupName);
      } catch (error) {
          console.error("Login Error:", error);
          if (window.confirm("데이터베이스 연결에 실패했습니다. 설정(API Key)이 올바르지 않을 수 있습니다.\n설정을 초기화하시겠습니까?")) {
              handleForceReset();
          }
      }
  };

  const toggleLock = async (forceUnlock = false) => {
      if (!db || !myId || !activeGroupId) return;

      let newLockedState = !isLocked;
      if (forceUnlock) newLockedState = false;

      setIsLocked(newLockedState);

      const memberRef = doc(db, 'groups', activeGroupId, 'members', myId);
      
      try {
        if (newLockedState) {
            await updateDoc(memberRef, {
                status: 'focus',
                message: '🔥 열공중'
            });
        } else {
            const apps = ['유튜브', '인스타', '카카오톡', '웹툰', '넷플릭스', '게임', '틱톡'];
            const randomApp = apps[Math.floor(Math.random() * apps.length)];
            const reason = forceUnlock ? `앱 이탈 감지됨 (${randomApp}?)` : `딴짓 감지됨 (${randomApp})`;
            
            await updateDoc(memberRef, {
                status: 'distracted',
                message: `🚨 ${reason}`
            });
        }
      } catch (e) {
          console.error("Status Update Failed", e);
      }
  };

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

  const handleUpdateGroup = async (id: string, name: string) => {
      if (!db) return;
      await updateDoc(doc(db, 'groups', id), { name });
  };
  const handleDeleteGroup = async (id: string) => {
      if (!db) return;
      await deleteDoc(doc(db, 'groups', id));
      setActiveGroupId('');
      localStorage.removeItem('sb_active_group');
      window.location.reload();
  };


  // --- RENDER ---

  // HARD RESET BUTTON (ALWAYS VISIBLE)
  const ResetButton = (
      <button 
        onClick={handleForceReset}
        className="fixed bottom-4 right-4 z-[9999] bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-2 rounded shadow-lg border border-red-400"
        title="문제가 발생했을 때 누르세요"
      >
        API KEY RESET
      </button>
  );

  if (configMissing) {
      return (
        <>
            <ConfigScreen onSaveConfig={handleSaveConfig} />
            {ResetButton}
        </>
      );
  }

  if (!myId || !activeGroupId) {
    return (
        <>
            <LoginScreen onLogin={handleLogin} onResetConfig={handleResetConfig} />
            {ResetButton}
        </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-md mx-auto relative pb-20">
      <Header />
      
      {activeTab !== TabType.CALENDAR && (
        <GroupHeader 
            groups={groups} 
            activeGroupId={activeGroupId}
            onSelectGroup={(id) => setActiveGroupId(id)} 
            onCreateGroup={(name) => handleLogin(myName, name, myAvatar)}
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
              onAddMember={() => {}} 
              onRemoveMember={() => {}}
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

      {ResetButton}
    </div>
  );
}

export default App;
