import React, { useEffect, useRef, useState } from 'react';
import { collection, addDoc, doc, getDoc, onSnapshot, query, updateDoc, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './VideoCalls.css';

type Role = 'teacher' | 'parent';

interface VideoCallsProps {
  userUid: string;
  userRole: Role;
}

interface CallItem {
  id: string;
  callerUid: string;
  calleeUid: string;
  status: 'ringing' | 'in_call' | 'ended' | 'rejected';
  createdAt?: any;
  startedAt?: any;
  endedAt?: any;
  durationMs?: number;
}

const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302'
    ] }
  ]
};

const VideoCalls: React.FC<VideoCallsProps> = ({ userUid, userRole }) => {
  const [calleeEmail, setCalleeEmail] = useState('');
  const [counterparts, setCounterparts] = useState<{ uid: string; name: string; email: string }[]>([]);
  const [selectedCalleeUid, setSelectedCalleeUid] = useState<string>('');
  const [incomingCalls, setIncomingCalls] = useState<CallItem[]>([]);
  const [history, setHistory] = useState<CallItem[]>([]);
  const [activeCall, setActiveCall] = useState<CallItem | null>(null);
  const [permissionError, setPermissionError] = useState('');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const stopOnSnapshotRef = useRef<(() => void) | null>(null);
  const stopCalleeCandidatesRef = useRef<(() => void) | null>(null);
  const stopCallerCandidatesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, 'calls'),
        where('calleeUid', '==', userUid),
        where('status', '==', 'ringing')
      ),
      (snap) => {
        const items: CallItem[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setIncomingCalls(items);
      }
    );

    const unsubHistory = onSnapshot(
      query(
        collection(db, 'calls'),
        where('participants', 'array-contains', userUid),
        orderBy('createdAt', 'desc')
      ),
      (snap) => {
        const items: CallItem[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setHistory(items);
      }
    );

    // Load counterparts: for teacher → parents of assigned children; for parent → assigned teachers of their children
    loadCounterparts().catch(() => {});

    return () => {
      unsub();
      unsubHistory();
      cleanupCallListeners();
      endMedia();
    };
  }, [userUid]);

  const loadCounterparts = async () => {
    try {
      if (userRole === 'teacher') {
        // Find children assigned to this teacher, then fetch their parents
        const childrenQ = query(collection(db, 'children'), where('assignedTeacherId', '==', userUid));
        const childrenSnap = await getDocs(childrenQ);
        const parentIds = Array.from(new Set(childrenSnap.docs.map(d => (d.data() as any).parentId).filter(Boolean)));
        if (parentIds.length === 0) { setCounterparts([]); return; }
        const usersSnap = await getDocs(query(collection(db, 'users')));
        const allUsers = usersSnap.docs.map(d => ({ uid: d.id, ...(d.data() as any) }));
        const parents = allUsers.filter(u => parentIds.includes(u.uid));
        setCounterparts(parents.map(p => ({ uid: p.uid, name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email, email: p.email })));
      } else {
        // Parent: find their children, then their assigned teacher(s)
        const childrenQ = query(collection(db, 'children'), where('parentId', '==', userUid));
        const childrenSnap = await getDocs(childrenQ);
        const teacherIds = Array.from(new Set(childrenSnap.docs.map(d => (d.data() as any).assignedTeacherId).filter(Boolean)));
        if (teacherIds.length === 0) { setCounterparts([]); return; }
        const usersSnap = await getDocs(query(collection(db, 'users')));
        const allUsers = usersSnap.docs.map(d => ({ uid: d.id, ...(d.data() as any) }));
        const teachers = allUsers.filter(u => teacherIds.includes(u.uid));
        setCounterparts(teachers.map(t => ({ uid: t.uid, name: `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.email, email: t.email })));
      }
    } catch (e) {
      setCounterparts([]);
    }
  };

  const requestMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setPermissionError('');
      return stream;
    } catch (err: any) {
      setPermissionError('Camera/microphone permission denied. Please allow access and try again.');
      throw err;
    }
  };

  const createPeer = () => {
    const pc = new RTCPeerConnection(rtcConfiguration);
    pcRef.current = pc;
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
    };
    return pc;
  };

  const findUserByEmail = async (email: string) => {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { uid: d.id, ...(d.data() as any) } as { uid: string };
  };

  const startCall = async () => {
    let callee: { uid: string } | null = null;
    if (selectedCalleeUid) {
      callee = { uid: selectedCalleeUid };
    } else if (calleeEmail.trim()) {
      callee = await findUserByEmail(calleeEmail.trim());
    }
    if (!callee) {
      alert('User not found by that email');
      return;
    }
    const stream = await requestMedia();
    const pc = createPeer();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    const callerCandidates = collection(db, 'temp'); // placeholder to ensure variable exists
    try { /* no-op to satisfy linter */ } catch {}

    const callDoc = await addDoc(collection(db, 'calls'), {
      callerUid: userUid,
      calleeUid: callee.uid,
      participants: [userUid, callee.uid],
      status: 'ringing',
      createdAt: serverTimestamp()
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await updateDoc(callDoc, { offer });

    // ICE candidates
    const callerCandCol = collection(db, 'calls', callDoc.id, 'callerCandidates');
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(callerCandCol, event.candidate.toJSON());
      }
    };
    stopCallerCandidatesRef.current = onSnapshot(collection(db, 'calls', callDoc.id, 'calleeCandidates'), (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const cand = new RTCIceCandidate(change.doc.data() as any);
          pc.addIceCandidate(cand);
        }
      });
    });

    stopOnSnapshotRef.current = onSnapshot(doc(db, 'calls', callDoc.id), async (d) => {
      const data = d.data();
      if (!data) return;
      if (data.answer && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        await updateDoc(d.ref, { status: 'in_call', startedAt: serverTimestamp() });
        setActiveCall({ id: d.id, ...(data as any) });
      }
      if (data.status === 'ended' || data.status === 'rejected') {
        endCallInternal(d.id);
      }
    });
  };

  const acceptCall = async (callId: string) => {
    const callRef = doc(db, 'calls', callId);
    const snap = await getDoc(callRef);
    if (!snap.exists()) return;
    const data = snap.data() as any;

    const stream = await requestMedia();
    const pc = createPeer();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await updateDoc(callRef, { answer, status: 'in_call', startedAt: serverTimestamp() });

    const calleeCandCol = collection(db, 'calls', callId, 'calleeCandidates');
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(calleeCandCol, event.candidate.toJSON());
      }
    };

    stopCalleeCandidatesRef.current = onSnapshot(collection(db, 'calls', callId, 'callerCandidates'), (snap2) => {
      snap2.docChanges().forEach(change => {
        if (change.type === 'added') {
          const cand = new RTCIceCandidate(change.doc.data() as any);
          pc.addIceCandidate(cand);
        }
      });
    });

    setActiveCall({ id: callId, ...(data as any) });
  };

  const rejectCall = async (callId: string) => {
    await updateDoc(doc(db, 'calls', callId), { status: 'rejected', endedAt: serverTimestamp() });
  };

  const endCallInternal = async (callId?: string) => {
    if (callId) {
      const callRef = doc(db, 'calls', callId);
      const snap = await getDoc(callRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data.status !== 'ended' && data.status !== 'rejected') {
          await updateDoc(callRef, { status: 'ended', endedAt: serverTimestamp() });
        }
      }
    }
    cleanupCallListeners();
    endMedia();
    setActiveCall(null);
  };

  const cleanupCallListeners = () => {
    if (stopOnSnapshotRef.current) { stopOnSnapshotRef.current(); stopOnSnapshotRef.current = null; }
    if (stopCalleeCandidatesRef.current) { stopCalleeCandidatesRef.current(); stopCalleeCandidatesRef.current = null; }
    if (stopCallerCandidatesRef.current) { stopCallerCandidatesRef.current(); stopCallerCandidatesRef.current = null; }
    if (pcRef.current) { try { pcRef.current.close(); } catch {} pcRef.current = null; }
  };

  const endMedia = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    remoteStreamRef.current?.getTracks().forEach(t => t.stop());
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
  };

  return (
    <div className="video-calls">
      <div className="calls-header">
        <h2>Video Calls ({userRole})</h2>
      </div>

      <div className="call-actions">
        <div className="start-call">
          <label htmlFor="calleeSelect">Select counterpart</label>
          <select id="calleeSelect" value={selectedCalleeUid} onChange={(e) => setSelectedCalleeUid(e.target.value)}>
            <option value="">-- Select --</option>
            {counterparts.map(c => (
              <option key={c.uid} value={c.uid}>{c.name} ({c.email})</option>
            ))}
          </select>
          <span style={{margin: '0 8px'}}>or</span>
          <input id="calleeEmail" type="email" value={calleeEmail} onChange={(e) => setCalleeEmail(e.target.value)} placeholder="Enter email" />
          <button onClick={startCall} disabled={!selectedCalleeUid && !calleeEmail}>Start Call</button>
          {permissionError && <div className="permission-error">{permissionError}</div>}
        </div>

        {incomingCalls.length > 0 && (
          <div className="incoming">
            <h3>Incoming Calls</h3>
            {incomingCalls.map(c => (
              <div key={c.id} className="incoming-item">
                <span>Incoming call</span>
                <button onClick={() => acceptCall(c.id)}>Accept</button>
                <button onClick={() => rejectCall(c.id)}>Reject</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="video-area">
        <div className="video-container">
          <video ref={localVideoRef} autoPlay playsInline muted className="video" />
          <div className="video-label">You</div>
        </div>
        <div className="video-container">
          <video ref={remoteVideoRef} autoPlay playsInline className="video" />
          <div className="video-label">Counterparty</div>
        </div>
      </div>

      {activeCall && (
        <div className="active-controls">
          <button onClick={() => endCallInternal(activeCall.id)}>End Call</button>
        </div>
      )}

      <div className="history">
        <h3>Call History</h3>
        {history.length === 0 ? (
          <div className="empty">No calls yet.</div>
        ) : (
          <ul className="history-list">
            {history.map(h => (
              <li key={h.id} className={`history-item ${h.status}`}>
                <span className="status">{h.status}</span>
                <span className="time">{h.createdAt?.toDate ? h.createdAt.toDate().toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VideoCalls;


