import React, { useState } from 'react';
import { 
  X, Users, Copy, Check, Shield, UserCheck, UserX, 
  Lock, Play, StopCircle, Radio
} from 'lucide-react';
import { CollaborationSession, Collaborator } from '../types';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CollaborationSession;
  onUpdateSession: (session: Partial<CollaborationSession>) => void;
  onStartSession: (roomName: string, userName: string) => void;
  onJoinSession: (roomId: string, userName: string) => void;
  onLeaveSession: () => void;
  onAcceptRequest: (requestId: string, role: 'editor' | 'viewer') => void;
  onRejectRequest: (requestId: string) => void;
  onRemoveCollaborator: (collaboratorId: string) => void;
  onToggleSimulatedCoWriter: () => void;
  isSimulating: boolean;
  theme?: 'light' | 'dark';
}

export default function CollaborationModal({
  isOpen,
  onClose,
  session,
  onUpdateSession,
  onStartSession,
  onJoinSession,
  onLeaveSession,
  onAcceptRequest,
  onRejectRequest,
  onRemoveCollaborator,
  onToggleSimulatedCoWriter,
  isSimulating,
  theme = 'dark'
}: CollaborationModalProps) {
  const [activeTab, setActiveTab] = useState<'room' | 'settings'>('room');
  const [inputRoomId, setInputRoomId] = useState('');
  const [inputUserName, setInputUserName] = useState(
    session.userName && session.userName !== 'Yazar 1 (Siz)' ? session.userName : (session.isHost ? 'Yazar 1 (Siz)' : 'Konuk Yazar')
  );
  const [copied, setCopied] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);

  const pendingRequests = session.pendingRequests || [];
  const collaborators = session.collaborators || [];

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] text-slate-100 border-[#2d3640]' : 'bg-[#FFFFF0] text-slate-900 border-[#c8bea8]';
  const cardBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640]' : 'bg-[#f4ede2] border-[#c8bea8]';
  const inputBg = theme === 'dark' ? 'bg-[#14181c] border-[#2d3640] text-slate-100' : 'bg-white border-[#c8bea8] text-slate-900';
  const btnHover = theme === 'dark' ? 'hover:bg-[#2d3640]' : 'hover:bg-[#dfd7ca]';
  const btnPrimary = theme === 'dark' ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white';

  const roomLink = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?room=${session.roomId || 'SH-DEMO'}` 
    : `https://scripthive.app?room=${session.roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendJoin = (roomIdToJoin: string, nameToUse: string) => {
    onJoinSession(roomIdToJoin, nameToUse);
    setHasSentRequest(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className={`relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl shadow-xl border ${bgClass} overflow-hidden font-sans`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'}`}>
          <div className="flex items-center gap-2.5">
            <Users size={18} className="opacity-80" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Ortak Yazar & Canlı Birlikte Yazım</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 ${btnHover} transition-colors`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center gap-2 px-5 pt-2 border-b text-xs ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'}`}>
          <button
            onClick={() => setActiveTab('room')}
            className={`pb-2 px-2.5 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'room'
                ? (theme === 'dark' ? 'border-sky-400 text-sky-400' : 'border-blue-600 text-blue-700')
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Users size={14} />
            <span>Oturum & Yazarlar</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 px-2.5 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? (theme === 'dark' ? 'border-sky-400 text-sky-400' : 'border-blue-600 text-blue-700')
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Shield size={14} />
            <span>Kilit & İzinler</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {activeTab === 'room' && (
            <div className="space-y-4">
              
              {!session.isConnected ? (
                /* Not Connected: Either Guest Invite or Host Create/Join */
                <div className="space-y-3">
                  
                  {session.roomId && !session.isHost ? (
                    /* GUEST INVITE VIEW */
                    <div className={`p-4 rounded-xl border space-y-3.5 ${cardBg}`}>
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                        <Users size={16} />
                        <span>Bu Senaryo Odasına Davet Edildiniz</span>
                      </div>
                      
                      <div className="p-3 rounded-lg border bg-black/10 flex items-center justify-between text-xs">
                        <span className="opacity-70">Oda Kodu:</span>
                        <span className="font-mono font-bold text-sm tracking-wider text-sky-400">{session.roomId}</span>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-medium opacity-70">Adınız & Soyadınız:</label>
                        <input 
                          type="text"
                          placeholder="örn: Selin Kaya"
                          value={inputUserName}
                          onChange={(e) => setInputUserName(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg text-xs border ${inputBg} focus:outline-hidden`}
                        />
                        
                        <button
                          onClick={() => handleSendJoin(session.roomId, inputUserName || 'Konuk Yazar')}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold ${btnPrimary} transition-colors flex items-center justify-center gap-1.5 shadow-sm`}
                        >
                          <Radio size={14} />
                          {hasSentRequest ? 'İstek Tekrar Gönderildi ✓' : 'Odaya Katılma İsteği Gönder'}
                        </button>

                        {hasSentRequest && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs text-center">
                            ⏳ Katılım isteğiniz ev sahibi yazara iletildi. Onay verildiğinde senaryo otomatik yüklenecektir.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* HOST START OR MANUAL JOIN VIEW */
                    <>
                      <div className={`p-4 rounded-xl border space-y-3 ${cardBg}`}>
                        <div className="text-xs font-bold opacity-90">Yeni Ortak Yazım Odası Aç</div>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Adınız (örn: Murat)"
                            value={inputUserName}
                            onChange={(e) => setInputUserName(e.target.value)}
                            className={`flex-1 px-3 py-1.5 rounded-lg text-xs border ${inputBg} focus:outline-hidden`}
                          />
                          <button
                            onClick={() => onStartSession('ScriptHive Canlı Oda', inputUserName || 'Yazar 1 (Siz)')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${btnPrimary} transition-colors`}
                          >
                            Oda Başlat
                          </button>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl border space-y-3 ${cardBg}`}>
                        <div className="text-xs font-bold opacity-90">Var Olan Bir Odaya Katıl</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input 
                            type="text"
                            placeholder="Adınız"
                            value={inputUserName}
                            onChange={(e) => setInputUserName(e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs border ${inputBg} focus:outline-hidden`}
                          />
                          <input 
                            type="text"
                            placeholder="Oda Kodu (örn: SH-1234)"
                            value={inputRoomId}
                            onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${inputBg} focus:outline-hidden`}
                          />
                        </div>
                        <button
                          onClick={() => handleSendJoin(inputRoomId, inputUserName || 'Konuk Yazar')}
                          disabled={!inputRoomId.trim()}
                          className={`w-full py-1.5 rounded-lg text-xs font-semibold border ${btnHover} disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5`}
                        >
                          <Radio size={13} />
                          Odaya Katılma İsteği Gönder
                        </button>
                      </div>
                    </>
                  )}

                </div>
              ) : (
                /* Connected Room Info */
                <div className="space-y-3">
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${cardBg}`}>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {session.isHost ? 'Aktif Oda Kodu' : 'Bağlı Olunan Oda'}
                      </div>
                      <div className="text-base font-mono font-bold text-sky-400">{session.roomId}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyLink}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${btnHover} transition-colors`}
                      >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copied ? 'Kopyalandı' : 'Davet Linki'}</span>
                      </button>
                      <button
                        onClick={onLeaveSession}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 border border-red-500/30 transition-colors"
                      >
                        Ayrıl
                      </button>
                    </div>
                  </div>

                  {/* Pending Requests (Host only) */}
                  {session.isHost && pendingRequests.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-amber-500">Onay Bekleyenler ({pendingRequests.length})</div>
                      {pendingRequests.map(req => (
                        <div key={req.id} className={`p-2.5 rounded-lg border flex items-center justify-between ${cardBg}`}>
                          <span className="text-xs font-medium">{req.name}</span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => onAcceptRequest(req.id, 'editor')}
                              className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1"
                            >
                              <UserCheck size={12} /> Onayla (Yazabilir)
                            </button>
                            <button
                              onClick={() => onRejectRequest(req.id)}
                              className="p-1 rounded text-red-400 hover:bg-red-500/10"
                            >
                              <UserX size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Collaborators List */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold opacity-70">Odadaki Yazarlar ({collaborators.length})</div>
                    {collaborators.map(collab => (
                      <div key={collab.id} className={`p-2 rounded-lg border flex items-center justify-between text-xs ${cardBg}`}>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: collab.avatarColor || '#38bdf8' }}
                          />
                          <span className="font-medium">{collab.name}</span>
                          <span className="text-[10px] opacity-50">
                            {collab.role === 'host' ? '(Ev Sahibi)' : '(Yazar)'}
                          </span>
                        </div>
                        {session.isHost && collab.role !== 'host' && (
                          <button
                            onClick={() => onRemoveCollaborator(collab.id)}
                            className="text-[11px] text-red-400 hover:underline"
                          >
                            Çıkar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simulation Box */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${cardBg}`}>
                <div className="text-xs">
                  <div className="font-semibold">Simülasyon Testi</div>
                  <div className="text-[11px] opacity-60">2. yazarın yazımını tek başınıza test edin.</div>
                </div>
                <button
                  onClick={onToggleSimulatedCoWriter}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    isSimulating 
                      ? 'bg-red-500/15 text-red-500 border-red-500/30' 
                      : `${btnHover}`
                  }`}
                >
                  {isSimulating ? <StopCircle size={13} /> : <Play size={13} />}
                  <span>{isSimulating ? 'Durdur' : 'Simüle Et'}</span>
                </button>
              </div>

            </div>
          )}

          {activeTab === 'settings' && (
            <div className={`p-4 rounded-xl border space-y-3.5 text-xs ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Paragraf Düzeyinde Kilit</div>
                  <div className="text-[11px] opacity-60">Yazılan satırı diğer yazarlar için geçici kilitler.</div>
                </div>
                <input
                  type="checkbox"
                  checked={session.lockActiveParagraphs}
                  onChange={(e) => onUpdateSession({ lockActiveParagraphs: e.target.checked })}
                  className="rounded cursor-pointer"
                />
              </div>

              <div className={`border-t ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'}`} />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Katılım Onay Zorunluluğu</div>
                  <div className="text-[11px] opacity-60">Odaya bağlanan yazarlar için ev sahibi onayı ister.</div>
                </div>
                <input
                  type="checkbox"
                  checked={session.requireApproval}
                  onChange={(e) => onUpdateSession({ requireApproval: e.target.checked })}
                  className="rounded cursor-pointer"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`px-5 py-2.5 border-t flex justify-end text-xs ${theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]'}`}>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg font-medium ${cardBg} ${btnHover} border transition-colors`}
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
}
