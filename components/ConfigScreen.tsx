
import React, { useState } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';

interface ConfigScreenProps {
  onSaveConfig: (config: any) => void;
}

export const ConfigScreen: React.FC<ConfigScreenProps> = ({ onSaveConfig }) => {
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    };
    onSaveConfig(config);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Settings className="text-red-500 w-8 h-8" />
            <h1 className="text-2xl font-bold text-white">서버 설정 필요</h1>
          </div>
          <p className="text-gray-400 text-sm">
            실시간 공유를 위해 Firebase 설정이 필요합니다.<br/>
            <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">
              Firebase Console
            </a>에서 프로젝트 생성 후 설정을 입력하세요.
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6 flex gap-3 items-start">
            <AlertCircle className="text-yellow-500 w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-200">
                <strong>설정 방법:</strong><br/>
                1. Firebase 프로젝트 생성 &rarr; 웹 앱 추가<br/>
                2. `firebaseConfig` 객체 내용 복사해서 아래 입력<br/>
                3. Firestore Database 생성 (규칙: test mode)
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">apiKey</label>
                <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" required />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">projectId</label>
                <input type="text" value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" required />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">authDomain</label>
                <input type="text" value={authDomain} onChange={e => setAuthDomain(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" required />
            </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">storageBucket</label>
                <input type="text" value={storageBucket} onChange={e => setStorageBucket(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" required />
            </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">messagingSenderId</label>
                <input type="text" value={messagingSenderId} onChange={e => setMessagingSenderId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" required />
            </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">appId</label>
                <input type="text" value={appId} onChange={e => setAppId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" required />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            <Save size={18} /> 설정 저장 및 시작
          </button>
        </form>
      </div>
    </div>
  );
};
