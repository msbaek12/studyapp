
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
  const [connectionError, setConnectionError] = useState(false);

  // Auth & User
  const [myId, setMyId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>('');
  const [myAvatar, setMyAvatar] = useState<string>('');
  
  // Group Data
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]); // List of IDs I've joined
  const [groups, setGroups] = useState<Group[]>([]); // Data for myGroupIds
  
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
    localStorage.removeItem('sb_active_group');
    localStorage.removeItem('sb_my_groups');
    window.location.reload();
  };
// --- INITIALIZATION ---
  useEffect(() => {
    // 1. 내 컴퓨터에 저장된 설정이 있는지 확인
    const storedConfig = localStorage.getItem('sb_firebase_config');
    
    // 2. Vercel 환경변수에서 가져온 "기본 설정" (손님용)
    // ★ 중요: 아래 빈칸('')에 본인의 Firebase 값들을 채워 넣으세요! (API Key 빼고)
    const envConfig = {
      apiKey: process.env.GEMINI_API_KEY, 
      authDomain: "studyapp-46cd4.firebaseapp.com", // 예: project-id.firebaseapp.com
      projectId: "studyapp-46cd4",                // 예: project-id
      storageBucket: "studyapp-46cd4.appspot.com", // 예: project-id.appspot.com
      messagingSenderId: "927515414304",        // Firebase 콘솔에서 복사
      appId: "1:927515414304:web:6c500cae3ed68de920d145"                        // Firebase 콘솔에서 복사
    };

    // 3. 사용할 설정 결정 (저장된 거 우선 -> 없으면 환경변수 사용)
    let configToUse = null;

    if (storedConfig) {
      configToUse = JSON.parse(storedConfig);
    } else if (envConfig.apiKey && envConfig.projectId) {
      configToUse = envConfig;
    }

    // 4. 결정된 설정으로 앱 시작
    if (configToUse) {
        try {
            if (!configToUse.apiKey || !configToUse.projectId) throw new Error("Invalid Config");

            if (!getApps().length) {
                const app = initializeApp(configToUse);
                setFirebaseApp(app);
                setDb(getFirestore(app));
            } else {
                const app = getApp();
                setFirebaseApp(app);
                setDb(getFirestore(app));
            }
            // 환경변수로 자동 로그인된 경우, 입력창 안 뜨게 설정
            setConfigMissing(false); 
        } catch (e) {
            console.error("Firebase Init Error", e);
            localStorage.removeItem('sb_firebase_config');
            setConfigMissing(true);
        }
    } else {
        // 둘 다 없으면 입력창 띄우기
        setConfigMissing(true);
    }

    // ... (Restore User Session 코드는 그대로 두세요) ...
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

  // --- REAL-TIME SYNC ---

  // 1. Sync "My Groups" List
  useEffect(() => {
    if (!db || myGroupIds.length === 0) {
        setGroups([]);
        return;
    }

    // Create a listener for EACH group I am in. 
    // Optimization: In a larger app, we might query 'groups' where 'members' contains me, 
    // but Firestore structure is 'groups/{id}/members/{id}'.
    // So distinct listeners for myGroupIds is the correct client-side approach here.
    const unsubscribes = myGroupIds.map(gid => {
        return onSnapshot(doc(db, 'groups', gid), (doc) => {
            if (doc.exists()) {
                setGroups(prev => {
                    const filtered = prev.filter(g => g.id !== gid);
                    return [...filtered, { id: doc.id, ...doc.data() } as Group];
                });
            } else {
                // Group might be deleted
                setGroups(prev => prev.filter(g => g.id !== gid));
            }
        }, (error) => {
            console.error("Group Sync Error", error);
            if (error.code === 'permission-denied' || error.code === 'unavailable') {
                setConnectionError(true);
            }
        });
    });

    return () => unsubscribes.forEach(u => u());
  }, [db, myGroupIds]);


  // 2. Sync Members of ACTIVE Group
  useEffect(() => {
    if (!db || !activeGroupId) return;
    const membersRef = collection(db, 'groups', activeGroupId, 'members');
    const unsub = onSnapshot(membersRef, (snapshot) => {
        const list: Member[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Member));
        setMembers(list);
    }, (error) => {
         console.error("Member Sync Error:", error);
         if (error.code === 'permission-denied') setConnectionError(true);
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

  // Helper to add group to local list
  const addToMyGroups = (groupId: string) => {
      setMyGroupIds(prev => {
          if (prev.includes(groupId)) return prev;
          const updated = [...prev, groupId];
          localStorage.setItem('sb_my_groups', JSON.stringify(updated));
          return updated;
      });
  };

  const handleLogin = async (name: string, groupName: string, groupPassword: string, avatarSeed: string) => {
      if (!db) {
          setConnectionError(true);
          return;
      }
      
      try {
          const newUserId = myId || `user-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          
          const groupRef = doc(db, 'groups', groupName);
          const groupSnap = await getDoc(groupRef);
          
          if (!groupSnap.exists()) {
              // CREATE NEW GROUP
              await setDoc(groupRef, {
                  name: groupName,
                  password: groupPassword, // Store simple password
                  color: '#' + Math.floor(Math.random()*16777215).toString(16),
                  createdAt: serverTimestamp()
              });
          } else {
              // JOIN EXISTING GROUP - CHECK PASSWORD
              const groupData = groupSnap.data();
              if (groupData.password !== groupPassword) {
                  alert("그룹 비밀번호가 일치하지 않습니다.");
                  return; // Stop execution
              }
          }

          // Add Member to Group
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

          // Update Local State
          setMyId(newUserId);
          setMyName(name);
          setMyAvatar(avatarSeed);
          setActiveGroupId(groupName);
          setSelectedMemberId(newUserId);
          addToMyGroups(groupName);

          localStorage.setItem('sb_user_id', newUserId);
          localStorage.setItem('sb_user_name', name);
          localStorage.setItem('sb_user_avatar', avatarSeed);
          localStorage.setItem('sb_active_group', groupName);

      } catch (error: any) {
          console.error("Login Error:", error);
          if (error.code === 'permission-denied' || error.code === 'unavailable') {
             setConnectionError(true);
          } else {
              alert("로그인 중 오류가 발생했습니다: " + error.message);
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
  
  // "Delete" for user means "Leave" locally
  const handleDeleteGroup = async (id: string) => {
      const updated = myGroupIds.filter(gid => gid !== id);
      setMyGroupIds(updated);
      localStorage.setItem('sb_my_groups', JSON.stringify(updated));

      // If active group was deleted
      if (activeGroupId === id) {
          if (updated.length > 0) {
              setActiveGroupId(updated[0]);
              localStorage.setItem('sb_active_group', updated[0]);
          } else {
              setActiveGroupId('');
              localStorage.removeItem('sb_active_group');
              window.location.reload(); // Force re-login if no groups
          }
      }
  };


  // --- RENDER ---

  // HARD RESET BUTTON
  const ResetButton = (
      <button 
        onClick={handleForceReset}
        className="fixed bottom-4 right-4 z-[9999] bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-2 rounded shadow-lg border border-red-400"
        title="설정 초기화 및 새로고침"
      >
        API KEY RESET
      </button>
  );

  // Error Overlay
  if (connectionError) {
      return (
          <div className="fixed inset-0 bg-gray-900 z-[9999] flex flex-col items-center justify-center p-6 text-center">
              <h1 className="text-2xl font-bold text-red-500 mb-4">데이터베이스 연결 오류</h1>
              <p className="text-gray-300 mb-6">API Key가 잘못되었거나 Firestore 권한이 없습니다.<br/>(규칙이 allow read, write: if true; 인지 확인하세요)</p>
              <button 
                onClick={handleResetConfig}
                className="bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-gray-200"
              >
                  API 키 다시 입력하기
              </button>
          </div>
      );
  }

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
            onSelectGroup={(id) => {
                setActiveGroupId(id);
                localStorage.setItem('sb_active_group', id);
            }} 
            onCreateGroup={(name, pwd) => handleLogin(myName, name, pwd, myAvatar)}
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
