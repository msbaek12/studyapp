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

declare global {
  interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

function App() {
  // --- STATE ---
  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [configMissing, setConfigMissing] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // Auth & User
  const [myId, setMyId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>('');
  const [myAvatar, setMyAvatar] = useState<string>('');
  
  // Group Data
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
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
    const initFirebase = () => {
        let config;
        let usingEnv = false;

        if (import.meta.env.VITE_FIREBASE_API_KEY) {
            config = {
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: import.meta.env.VITE_FIREBASE_APP_ID
            };
            usingEnv = true;
        } else {
            const storedConfig = localStorage.getItem('sb_firebase_config');
            if (storedConfig) {
                config = JSON.parse(storedConfig);
            }
        }

        if (config && config.apiKey) {
            try {
                if (!getApps().length) {
                    const app = initializeApp(config);
                    setFirebaseApp(app);
                    setDb(getFirestore(app));
                } else {
                    const app = getApp();
                    setFirebaseApp(app);
                    setDb(getFirestore(app));
                }
                setConfigMissing(false);
            } catch (e) {
                console.error("Firebase Init Error", e);
                if (!usingEnv) {
                    localStorage.removeItem('sb_firebase_config');
                    setConfigMissing(true);
                }
            }
        } else {
            setConfigMissing(true);
        }
    };

    initFirebase();

    // Restore User Session
    const storedId = localStorage.getItem('sb_user_id');
    const storedName = localStorage.getItem('sb_user_name');
    const storedAvatar = localStorage.getItem('sb_user_avatar');
    const storedActiveGroup = localStorage.getItem('sb_active_group');
    const storedMyGroups = localStorage.getItem('sb_my_groups');

    if (storedId && storedName && storedAvatar) {
        setMyId(storedId);
        setMyName(storedName);
        setMyAvatar(storedAvatar);
        
        if (storedMyGroups) {
            setMyGroupIds(JSON.parse(storedMyGroups));
        }
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
     setConfigMissing(true);
     setConnectionError(false);
     window.location.reload();
  };

  // --- SYNC ---
  useEffect(() => {
    if (!db || myGroupIds.length === 0) {
        setGroups([]);
        return;
    }
    const unsubscribes = myGroupIds.map(gid => {
        return onSnapshot(doc(db, 'groups', gid), (doc) => {
            if (doc.exists()) {
                setGroups(prev => {
                    const filtered = prev.filter(g => g.id !== gid);
                    return [...filtered, { id: doc.id, ...doc.data() } as Group];
                });
            } else {
                setGroups(prev => prev.filter(g => g.id !== gid));
                // Handle case where group was deleted remotely
                setMyGroupIds(prev => {
                    const updated = prev.filter(id => id !== gid);
                    localStorage.setItem('sb_my_groups', JSON.stringify(updated));
                    return updated;
                });
                if (activeGroupId === gid) {
                    setActiveGroupId('');
                    localStorage.removeItem('sb_active_group');
                }
            }
        }, (error) => {
            console.error("Group Sync Error", error);
            if (error.code === 'permission-denied') setConnectionError(true);
        });
    });
    return () => unsubscribes.forEach(u => u());
  }, [db, myGroupIds, activeGroupId]);

  useEffect(() => {
    if (!db || !activeGroupId) {
        setMembers([]);
        return;
    }
    const membersRef = collection(db, 'groups', activeGroupId, 'members');
    const unsub = onSnapshot(membersRef, (snapshot) => {
        const list: Member[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Member));
        setMembers(list);
    }, (error) => {
         if (error.code === 'permission-denied') setConnectionError(true);
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


  // --- USER & GROUP ACTIONS ---

  const handleLogin = (name: string, avatarSeed: string) => {
      const newUserId = myId || `user-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      
      setMyId(newUserId);
      setMyName(name);
      setMyAvatar(avatarSeed);

      localStorage.setItem('sb_user_id', newUserId);
      localStorage.setItem('sb_user_name', name);
      localStorage.setItem('sb_user_avatar', avatarSeed);
  };

  const addMeToGroup = async (groupId: string, name: string, avatar: string) => {
      if (!db || !myId) return;
      const memberRef = doc(db, 'groups', groupId, 'members', myId);
      await setDoc(memberRef, {
          id: myId,
          name: name,
          avatarSeed: avatar,
          status: 'distracted', 
          message: '입장함',
          groupId: groupId,
          joinedAt: serverTimestamp()
      }, { merge: true });

      setMyGroupIds(prev => {
          if (prev.includes(groupId)) return prev;
          const updated = [...prev, groupId];
          localStorage.setItem('sb_my_groups', JSON.stringify(updated));
          return updated;
      });
      setActiveGroupId(groupId);
      setSelectedMemberId(myId);
      localStorage.setItem('sb_active_group', groupId);
  };

  const handleCreateGroup = async (name: string, password: string) => {
      if (!db || !myId) return;
      const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // Random 6 char code
      
      try {
        await setDoc(doc(db, 'groups', code), {
            name: name,
            password: password,
            ownerId: myId,
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            createdAt: serverTimestamp()
        });
        await addMeToGroup(code, myName, myAvatar);
        alert(`그룹이 생성되었습니다. 입장 코드: [${code}]`);
      } catch (e) {
        console.error("Create Group Error", e);
        alert("그룹 생성 중 오류가 발생했습니다.");
      }
  };

  const handleJoinGroup = async (code: string, password: string) => {
      if (!db || !myId) return;
      try {
          const groupRef = doc(db, 'groups', code);
          const groupSnap = await getDoc(groupRef);
          
          if (!groupSnap.exists()) {
              alert("존재하지 않는 그룹 코드입니다.");
              return;
          }
          const groupData = groupSnap.data();
          if (groupData.password !== password) {
              alert("비밀번호가 일치하지 않습니다.");
              return;
          }
          await addMeToGroup(code, myName, myAvatar);
      } catch (e) {
          console.error("Join Group Error", e);
          alert("그룹 입장 중 오류가 발생했습니다.");
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
            await updateDoc(memberRef, { status: 'focus', message: '🔥 열공중' });
        } else {
            const apps = ['유튜브', '인스타', '카카오톡', '웹툰', '넷플릭스', '게임', '틱톡'];
            const randomApp = apps[Math.floor(Math.random() * apps.length)];
            const reason = forceUnlock ? `앱 이탈 감지됨 (${randomApp}?)` : `딴짓 감지됨 (${randomApp})`;
            await updateDoc(memberRef, { status: 'distracted', message: `🚨 ${reason}` });
        }
      } catch (e) {}
  };

  // CRUD
  const handleAddTimetable = async (start: string, end: string, subj: string) => {
      if (!db || !activeGroupId || !myId) return;
      await setDoc(doc(collection(db, 'groups', activeGroupId, 'timetables')), {
          userId: myId, startTime: start, endTime: end, subject: subj
      });
  };
  const handleUpdateTimetable = async (id: string, s: string, e: string, subj: string) => {
    if (!db || !activeGroupId) return;
    await updateDoc(doc(db, 'groups', activeGroupId, 'timetables', id), { startTime: s, endTime: e, subject: subj });
  };
  const handleDeleteTimetable = async (id: string) => await deleteDoc(doc(db, 'groups', activeGroupId, 'timetables', id));

  const handleAddTodo = async (text: string) => {
    if (!db || !activeGroupId || !myId) return;
    await setDoc(doc(collection(db, 'groups', activeGroupId, 'todos')), { userId: myId, text, completed: false });
  };
  const handleToggleTodo = async (uid: string, id: string) => {
     if (uid !== myId || !db || !activeGroupId) return; 
     const item = todos[myId]?.find(t => t.id === id);
     if (item) await updateDoc(doc(db, 'groups', activeGroupId, 'todos', id), { completed: !item.completed });
  };
  const handleUpdateTodo = async (id: string, text: string) => await updateDoc(doc(db, 'groups', activeGroupId, 'todos', id), { text });
  const handleDeleteTodo = async (id: string) => await deleteDoc(doc(db, 'groups', activeGroupId, 'todos', id));

  const handleUpdateGroup = async (id: string, name: string) => {
      if (!db) return;
      await updateDoc(doc(db, 'groups', id), { name });
  };
  
  const handleDeleteGroup = async (id: string) => {
      if (!db) return;
      await deleteDoc(doc(db, 'groups', id));
      handleLeaveGroup(id); // Clean up local state
  };

  const handleLeaveGroup = async (id: string) => {
    if (db && myId) {
        // Try to remove self from members list (optional/clean up)
        try {
            await deleteDoc(doc(db, 'groups', id, 'members', myId));
        } catch(e) {}
    }
    const updated = myGroupIds.filter(gid => gid !== id);
    setMyGroupIds(updated);
    localStorage.setItem('sb_my_groups', JSON.stringify(updated));

    if (activeGroupId === id) {
        if (updated.length > 0) {
            setActiveGroupId(updated[0]);
            localStorage.setItem('sb_active_group', updated[0]);
        } else {
            setActiveGroupId('');
            localStorage.removeItem('sb_active_group');
        }
    }
  };

  // --- RENDER ---

  if (configMissing) {
      return (
        <div className="relative">
            <ConfigScreen onSaveConfig={handleSaveConfig} />
        </div>
      );
  }

  // Error Overlay
  if (connectionError) {
      return (
          <div className="fixed inset-0 bg-gray-900 z-[9999] flex flex-col items-center justify-center p-6 text-center">
              <h1 className="text-2xl font-bold text-red-500 mb-4">데이터베이스 연결 오류</h1>
              <p className="text-gray-300 mb-6">Firestore 권한이 없거나 설정이 잘못되었습니다.</p>
              <button onClick={handleResetConfig} className="bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-gray-200">
                  설정 초기화
              </button>
          </div>
      );
  }

  if (!myId) {
    return <LoginScreen onLogin={handleLogin} onResetConfig={handleResetConfig} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-md mx-auto relative pb-20">
      <Header />
      
      {activeTab !== TabType.CALENDAR && (
        <GroupHeader 
            groups={groups} 
            activeGroupId={activeGroupId}
            currentUserId={myId}
            onSelectGroup={(id) => {
                setActiveGroupId(id);
                localStorage.setItem('sb_active_group', id);
            }} 
            onCreateGroup={handleCreateGroup}
            onJoinGroup={handleJoinGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onLeaveGroup={handleLeaveGroup}
        />
      )}

      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {activeTab === TabType.GROUP && (
            activeGroupId ? (
                <>
                    <TimerDisplay 
                        isRunning={isTimerRunning}
                        distractedMemberName={distractedMember?.name}
                        distractedMessage={distractedMember?.message}
                        isMeDistracted={distractedMember?.id === myId}
                        seconds={timerSeconds}
                        onReset={() => setTimerSeconds(0)}
                    />
                    <Controls isLocked={isLocked} toggleLock={() => toggleLock()} />
                    <MemberList 
                        members={members}
                        onAddMember={() => {}} 
                        onRemoveMember={() => {}}
                        currentUserId={myId}
                        groupName={groups.find(g => g.id === activeGroupId)?.name || ''}
                    />
                </>
            ) : (
                <div className="text-center py-10 bg-gray-800 rounded-2xl border border-gray-700 border-dashed">
                    <p className="text-gray-400">선택된 그룹이 없습니다.</p>
                    <p className="text-sm text-gray-500 mt-2">상단 메뉴에서 그룹을 생성하거나 입장하세요.</p>
                </div>
            )
        )}

        {activeTab === TabType.CALENDAR && <GroupCalendar groups={groups} />}

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