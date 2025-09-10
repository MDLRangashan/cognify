import React, { useState, useEffect } from 'react';
import { collection, query, where, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './MessagingSystem.css';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'parent' | 'teacher';
  receiverId: string;
  receiverName: string;
  receiverRole: 'parent' | 'teacher';
  subject: string;
  content: string;
  timestamp: any;
  isRead: boolean;
  studentId?: string;
  studentName?: string;
}

interface MessagingSystemProps {
  userRole: 'parent' | 'teacher';
  children?: any[];
  assignedStudents?: any[];
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ 
  userRole, 
  children = [], 
  assignedStudents = [] 
}) => {
  const { userData } = useAuth();
  const { t } = useLanguage();
  
  console.log('MessagingSystem props:', { userRole, children, assignedStudents });
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [composeMessage, setComposeMessage] = useState(false);
  const [isReply, setIsReply] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState({
    receiverId: '',
    receiverName: '',
    receiverRole: 'parent' as 'parent' | 'teacher',
    subject: '',
    content: '',
    studentId: '',
    studentName: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sending, setSending] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  const fetchMessages = async () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }

    try {
      const messagesRef = collection(db, 'messages');
      
      // Get sent messages
      const sentQuery = query(
        messagesRef,
        where('senderId', '==', userData.uid)
      );
      
      // Get received messages
      const receivedQuery = query(
        messagesRef,
        where('receiverId', '==', userData.uid)
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);

      const allMessages: Message[] = [];
      
      // Process sent messages
      sentSnapshot.forEach((doc) => {
        allMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      
      // Process received messages
      receivedSnapshot.forEach((doc) => {
        const message = { id: doc.id, ...doc.data() } as Message;
        // Avoid duplicates
        if (!allMessages.find(m => m.id === doc.id)) {
          allMessages.push(message);
        }
      });
      
      // Sort by timestamp
      allMessages.sort((a, b) => {
        const aTime = a.timestamp?.toDate() || new Date(0);
        const bTime = b.timestamp?.toDate() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      
      setMessages(allMessages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [userData?.uid]);

  // Fetch available contacts when component mounts
  useEffect(() => {
    console.log('useEffect triggered for contacts loading');
    console.log('Current state - userRole:', userRole, 'children:', children, 'assignedStudents:', assignedStudents);
    
    const loadContacts = async () => {
      console.log('=== STARTING CONTACT LOADING ===');
      console.log('Loading contacts for role:', userRole);
      setContactsLoading(true);
      
      try {
        let contacts = [];
        if (userRole === 'parent') {
          console.log('Loading parent contacts...');
          contacts = await fetchParentContacts();
          console.log('Parent contacts loaded:', contacts);
        } else {
          console.log('Loading teacher contacts...');
          contacts = getAvailableContacts();
          console.log('Teacher contacts loaded:', contacts);
        }
        setAvailableContacts(contacts || []);
        console.log('Available contacts set:', contacts);
      } catch (error) {
        console.error('Error loading contacts:', error);
        // Fallback to child teachers for parents
        if (userRole === 'parent') {
          console.log('Using fallback for parent contacts');
          const fallbackContacts = getChildTeachers();
          setAvailableContacts(fallbackContacts);
        } else {
          setAvailableContacts([]);
        }
      } finally {
        console.log('Setting contacts loading to false');
        setContactsLoading(false);
        console.log('=== CONTACT LOADING COMPLETED ===');
      }
    };
    
    // Add a small delay to prevent rapid re-renders
    const timeoutId = setTimeout(() => {
      loadContacts();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [userRole]);

  // Update selected conversation when messages change
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const updatedConversations = getConversations();
      const updatedConversation = updatedConversations.find(conv => conv.id === selectedConversation.id);
      if (updatedConversation) {
        setSelectedConversation(updatedConversation);
      }
    }
  }, [messages]);

  const getAvailableContacts = () => {
    console.log('Getting contacts for role:', userRole);
    console.log('Children:', children);
    console.log('Assigned students:', assignedStudents);
    
    if (userRole === 'parent') {
      // For parents, return empty array initially - will be populated by async fetch
      return [];
    } else {
      // Teachers can message parents of their assigned students
      const parents = new Map();
      
      // Safety check for assignedStudents
      if (assignedStudents && Array.isArray(assignedStudents)) {
        assignedStudents.forEach(student => {
          console.log('Processing student:', student);
          if (student && student.parentId && student.parentName) {
            parents.set(student.parentId, {
              id: student.parentId,
              name: student.parentName,
              role: 'parent',
              studentId: student.id,
              studentName: `${student.firstName} ${student.lastName}`
            });
          }
        });
      }
      
      const result = Array.from(parents.values());
      console.log('Teacher contacts (parents):', result);
      return result;
    }
  };

  const fetchParentContacts = async () => {
    console.log('=== fetchParentContacts called ===');
    console.log('userRole:', userRole);
    
    if (userRole !== 'parent') {
      console.log('Not a parent, returning empty array');
      return [];
    }
    
    console.log('Fetching parent contacts...');
    console.log('Children data:', children);
    
    try {
      // For now, let's use only child's teachers to avoid database issues
      console.log('Using child teachers approach for parents');
      const result = getChildTeachers();
      console.log('getChildTeachers result:', result);
      return result;
    } catch (error) {
      console.error('Error in fetchParentContacts:', error);
      return [];
    }
    
    // Commented out database approach for now
    /*
    try {
      // First try to get all teachers (without approval filter)
      const teachersRef = collection(db, 'users');
      const teachersQuery = query(
        teachersRef,
        where('role', '==', 'teacher')
      );
      
      console.log('Querying teachers from database...');
      const teachersSnapshot = await getDocs(teachersQuery);
      console.log('Teachers query result:', teachersSnapshot.size, 'teachers found');
      
      const teachers: any[] = [];
      teachersSnapshot.forEach((doc) => {
        const teacherData = doc.data();
        console.log('Teacher data:', teacherData);
        
        // Check if teacher is approved (handle different field names)
        const isApproved = teacherData.isApproved === true || 
                          teacherData.approved === true || 
                          teacherData.status === 'approved' ||
                          teacherData.isActive === true;
        
        if (isApproved) {
          teachers.push({
            id: doc.id,
            name: `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim(),
            role: 'teacher',
            studentId: '', // No specific student context for general teacher contact
            studentName: 'General Inquiry'
          });
        }
      });
      
      console.log('Parent contacts (all approved teachers):', teachers);
      
      // If no approved teachers found, fallback to child's teachers
      if (teachers.length === 0) {
        console.log('No approved teachers found, falling back to child teachers');
        return getChildTeachers();
      }
      
      return teachers;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      // Fallback to child's teachers if there's an error
      return getChildTeachers();
    }
    */
  };

  const getChildTeachers = () => {
    console.log('=== getChildTeachers called ===');
    console.log('Getting child teachers, children data:', children);
    console.log('Children type:', typeof children);
    console.log('Children is array:', Array.isArray(children));
    
    const teachers = new Map();
    
    if (children && Array.isArray(children)) {
      console.log('Processing children array, length:', children.length);
      children.forEach((child, index) => {
        console.log(`Processing child ${index}:`, child);
        if (child && child.assignedTeacherId && child.assignedTeacherName) {
          console.log('Adding teacher for child:', child.assignedTeacherName);
          teachers.set(child.assignedTeacherId, {
            id: child.assignedTeacherId,
            name: child.assignedTeacherName,
            role: 'teacher',
            studentId: child.id,
            studentName: `${child.firstName} ${child.lastName}`
          });
        } else {
          console.log('Child missing teacher data:', child);
        }
      });
    } else {
      console.log('No children data available, creating dummy teacher for testing');
      // Create a dummy teacher for testing if no children data
      teachers.set('dummy-teacher', {
        id: 'dummy-teacher',
        name: 'Test Teacher',
        role: 'teacher',
        studentId: 'dummy-student',
        studentName: 'Test Student'
      });
    }
    
    const result = Array.from(teachers.values());
    console.log('Parent contacts (fallback - child teachers):', result);
    console.log('=== getChildTeachers completed ===');
    return result;
  };

  const getConversations = () => {
    const conversationMap = new Map();
    
    console.log('Messages count:', messages.length);
    console.log('Messages:', messages);
    
    // If there are messages, group them into conversations
    if (messages.length > 0) {
      messages.forEach(message => {
        const otherUserId = message.senderId === userData?.uid ? message.receiverId : message.senderId;
        const otherUserName = message.senderId === userData?.uid ? message.receiverName : message.senderName;
        const otherUserRole = message.senderId === userData?.uid ? message.receiverRole : message.senderRole;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId, // Use otherUserId as the conversation ID, not message.id
            name: otherUserName,
            role: otherUserRole,
            studentName: message.studentName,
            lastMessage: message.content,
            lastMessageTime: message.timestamp?.toDate().toLocaleDateString() || 'Unknown',
            unread: !message.isRead && message.receiverId === userData?.uid,
            messages: []
          });
        }
        
        const conversation = conversationMap.get(otherUserId);
        conversation.messages.push(message);
        
        // Update with the latest message
        if (message.timestamp && (!conversation.lastMessageTime || message.timestamp.toDate() > new Date(conversation.lastMessageTime))) {
          conversation.lastMessage = message.content;
          conversation.lastMessageTime = message.timestamp.toDate().toLocaleDateString();
          conversation.unread = !message.isRead && message.receiverId === userData?.uid;
        }
      });
    } else {
      // If no messages, show available contacts as potential conversations
      console.log('No messages, showing contacts:', availableContacts);
      if (availableContacts && Array.isArray(availableContacts)) {
        availableContacts.forEach((contact, index) => {
          if (contact && contact.id) {
            conversationMap.set(contact.id, {
              id: `contact-${contact.id}`,
              name: contact.name,
              role: contact.role,
              studentName: contact.studentName,
              lastMessage: 'No messages yet',
              lastMessageTime: 'Start conversation',
              unread: false,
              messages: [],
              isContact: true
            });
          }
        });
      }
    }
    
    const conversations = Array.from(conversationMap.values()).sort((a, b) => {
      if (a.isContact && !b.isContact) return 1;
      if (!a.isContact && b.isContact) return -1;
      
      // Handle date comparison properly
      const aTime = a.lastMessageTime === 'Start conversation' ? 0 : new Date(a.lastMessageTime).getTime();
      const bTime = b.lastMessageTime === 'Start conversation' ? 0 : new Date(b.lastMessageTime).getTime();
      
      return bTime - aTime;
    });
    
    console.log('Final conversations:', conversations);
    return conversations;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sending) return; // Prevent double submission
    
    if (!userData?.uid || !newMessage.receiverId || !newMessage.subject || !newMessage.content) {
      alert('Please fill in all required fields.');
      return;
    }

    setSending(true);
    
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: userData.uid,
        senderName: `${userData.firstName} ${userData.lastName}`,
        senderRole: userRole,
        receiverId: newMessage.receiverId,
        receiverName: newMessage.receiverName,
        receiverRole: newMessage.receiverRole,
        subject: newMessage.subject,
        content: newMessage.content,
        studentId: newMessage.studentId,
        studentName: newMessage.studentName,
        timestamp: serverTimestamp(),
        isRead: false
      });

      // Show success message
      alert(isReply ? 'Reply sent successfully!' : 'Message sent successfully!');
      
      setNewMessage({
        receiverId: '',
        receiverName: '',
        receiverRole: 'parent',
        subject: '',
        content: '',
        studentId: '',
        studentName: ''
      });
      setComposeMessage(false);
      setIsReply(false);
      setReplyToMessage(null);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleContactSelect = (contact: any) => {
    setNewMessage({
      ...newMessage,
      receiverId: contact.id,
      receiverName: contact.name,
      receiverRole: contact.role,
      studentId: contact.studentId,
      studentName: contact.studentName
    });
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      const messageData = {
        senderId: userData?.uid,
        senderName: `${userData?.firstName} ${userData?.lastName}`,
        senderRole: userRole,
        receiverId: selectedConversation.isContact ? selectedConversation.id.replace('contact-', '') : selectedConversation.id,
        receiverName: selectedConversation.name,
        receiverRole: selectedConversation.role,
        subject: `Chat with ${selectedConversation.name}`,
        content: chatMessage,
        timestamp: new Date(),
        isRead: false,
        studentId: selectedConversation.studentId || '',
        studentName: selectedConversation.studentName || ''
      };

      await addDoc(collection(db, 'messages'), messageData);
      
      // Create the new message object for immediate UI update
      const newMessage: Message = {
        id: 'temp-' + Date.now(), // Temporary ID for immediate display
        senderId: messageData.senderId!,
        senderName: messageData.senderName,
        senderRole: messageData.senderRole,
        receiverId: messageData.receiverId,
        receiverName: messageData.receiverName,
        receiverRole: messageData.receiverRole,
        subject: messageData.subject,
        content: messageData.content,
        studentId: messageData.studentId,
        studentName: messageData.studentName,
        timestamp: { toDate: () => new Date() } as any, // Mock timestamp object
        isRead: messageData.isRead
      };
      
      // Update messages state immediately for instant UI update
      setMessages(prevMessages => {
        const updatedMessages = [newMessage, ...prevMessages];
        // Sort by timestamp
        return updatedMessages.sort((a, b) => {
          const aTime = a.timestamp?.toDate() || new Date(0);
          const bTime = b.timestamp?.toDate() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
      });
      
      // Update the selected conversation immediately
      if (selectedConversation) {
        const updatedConversation = {
          ...selectedConversation,
          lastMessage: newMessage.content,
          lastMessageTime: newMessage.timestamp.toDate().toLocaleDateString(),
          messages: [...(selectedConversation.messages || []), newMessage]
        };
        setSelectedConversation(updatedConversation);
      }
      
      // Clear the input
      setChatMessage('');
      
      // Refresh messages from server in background to get the real message ID
      fetchMessages();
      
      // Scroll to bottom of chat messages
      setTimeout(() => {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
    setIsReply(true);
    setNewMessage({
      receiverId: message.senderId,
      receiverName: message.senderName,
      receiverRole: message.senderRole,
      subject: `Re: ${message.subject}`,
      content: '',
      studentId: message.studentId || '',
      studentName: message.studentName || ''
    });
    setComposeMessage(true);
  };

  const handleComposeNew = () => {
    setIsReply(false);
    setReplyToMessage(null);
    setNewMessage({
      receiverId: '',
      receiverName: '',
      receiverRole: 'parent',
      subject: '',
      content: '',
      studentId: '',
      studentName: ''
    });
    setComposeMessage(true);
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.receiverName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'unread') return matchesSearch && !message.isRead;
    return matchesSearch;
  });

  const unreadCount = messages.filter(m => !m.isRead && m.receiverId === userData?.uid).length;

  if (loading || contactsLoading) {
    return (
      <div className="messaging-loading">
        <div className="loading-spinner"></div>
        <p>{loading ? 'Loading messages...' : 'Loading contacts...'}</p>
      </div>
    );
  }

  // Show empty state if no messages
  if (messages.length === 0) {
    return (
      <div className="messaging-system">
        <div className="messaging-header">
          <h2>Messages</h2>
          <div className="header-actions">
            <button 
              className="compose-btn"
              onClick={handleComposeNew}
            >
              <span className="btn-icon">✉️</span>
              New Message
            </button>
          </div>
        </div>
        
        <div className="empty-messages">
          <div className="empty-icon">💬</div>
          <h3>No Messages Yet</h3>
          <p>Start a conversation with {userRole === 'parent' ? 'your child\'s teachers' : 'your students\' parents'}</p>
          <button 
            className="start-conversation-btn"
            onClick={handleComposeNew}
          >
            Start Conversation
          </button>
        </div>

        {composeMessage && (
          <div className="compose-modal">
            <div className="compose-content">
              <div className="compose-header">
                <h3>Compose New Message</h3>
                <button 
                  className="close-btn"
                  onClick={() => setComposeMessage(false)}
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSendMessage} className="compose-form">
                <div className="form-group">
                  <label>To:</label>
                  <select
                    value={newMessage.receiverId}
                    onChange={(e) => {
                      const contact = availableContacts.find(c => c.id === e.target.value);
                      if (contact) handleContactSelect(contact);
                    }}
                    required
                  >
                    <option value="">Select recipient</option>
                    {availableContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} ({contact.role}) - {contact.studentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject:</label>
                  <input
                    type="text"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                    placeholder={t('common.enterMessageSubject')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Message:</label>
                  <textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                    placeholder="Type your message here..."
                    rows={6}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => setComposeMessage(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="send-btn">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="messaging-system">
      <div className="messaging-header">
        <h2>Messages</h2>
        <div className="header-actions">
          <button 
            className="compose-btn"
            onClick={() => setComposeMessage(true)}
          >
            <span className="btn-icon">✉️</span>
            New Message
          </button>
        </div>
      </div>

       <div className="messaging-container">
         <div className="messages-sidebar">
           <div className="search-box">
             <input
               type="text"
               placeholder="Search conversations..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <span className="search-icon">🔍</span>
           </div>

           <div className="message-filters">
             <button 
               className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
               onClick={() => setFilterType('all')}
             >
               All Conversations
             </button>
             <button 
               className={`filter-btn ${filterType === 'unread' ? 'active' : ''}`}
               onClick={() => setFilterType('unread')}
             >
               Unread ({unreadCount})
             </button>
           </div>

           <div className="conversations-list">
             {getConversations().map((conversation) => (
               <div 
                 key={conversation.id}
                 className={`conversation-item ${conversation.unread ? 'unread' : ''} ${selectedConversation?.id === conversation.id ? 'selected' : ''}`}
                 onClick={() => setSelectedConversation(conversation)}
               >
                 <div className="conversation-avatar">
                   {conversation.name ? conversation.name.charAt(0).toUpperCase() : '?'}
                 </div>
                 <div className="conversation-content">
                   <div className="conversation-header">
                     <h4 className="conversation-name">{conversation.name || 'Unknown Contact'}</h4>
                     <span className="conversation-time">
                       {conversation.lastMessageTime || 'Unknown time'}
                     </span>
                   </div>
                   <p className="conversation-preview">{conversation.lastMessage || 'No messages yet'}</p>
                   {conversation.studentName && (
                     <span className="conversation-student">Re: {conversation.studentName}</span>
                   )}
                 </div>
               </div>
             ))}
           </div>
         </div>

         <div className="chat-area">
           {selectedConversation ? (
             <>
               <div className="chat-header">
                 <div className="chat-avatar">
                   {selectedConversation.name ? selectedConversation.name.charAt(0).toUpperCase() : '?'}
                 </div>
                 <div className="chat-info">
                   <h3>{selectedConversation.name || 'Unknown Contact'}</h3>
                   <p>{selectedConversation.studentName ? `Re: ${selectedConversation.studentName}` : 'Online'}</p>
                 </div>
               </div>
               <div className="chat-messages">
                 {selectedConversation.isContact ? (
                   <div className="no-conversation-selected">
                     <div className="empty-icon">💬</div>
                     <h3>Start a conversation</h3>
                     <p>Send a message to {selectedConversation.name} to start the conversation</p>
                     <button 
                       className="start-conversation-btn"
                       onClick={() => {
                         // Pre-fill the compose form with this contact
                         setNewMessage({
                           receiverId: selectedConversation.id.replace('contact-', ''),
                           receiverName: selectedConversation.name,
                           receiverRole: selectedConversation.role,
                           subject: '',
                           content: '',
                           studentId: selectedConversation.studentId || '',
                           studentName: selectedConversation.studentName || ''
                         });
                         setComposeMessage(true);
                       }}
                     >
                       Send Message
                     </button>
                   </div>
                 ) : (
                   <div>
                     {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                       selectedConversation.messages.map((message: Message) => (
                         <div key={message.id} className={`message-bubble ${message.senderId === userData?.uid ? 'sent' : 'received'}`}>
                           <div className="message-bubble-content">
                             {message.content}
                           </div>
                           <div className="message-bubble-time">
                             {message.timestamp?.toDate().toLocaleString()}
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="no-conversation-selected">
                         <div className="empty-icon">💬</div>
                         <h3>No messages yet</h3>
                         <p>Start the conversation by sending a message</p>
                       </div>
                     )}
                   </div>
                 )}
               </div>
               
               {/* WhatsApp-style text input at bottom */}
               {!selectedConversation.isContact && (
                 <div className="chat-input-container">
                   <div className="chat-input-wrapper">
                     <input
                       type="text"
                       value={chatMessage}
                       onChange={(e) => setChatMessage(e.target.value)}
                       placeholder="Type a message..."
                       className="chat-input"
                       onKeyPress={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleSendChatMessage();
                         }
                       }}
                       disabled={sendingMessage}
                     />
                     <button
                       className="send-button"
                       onClick={handleSendChatMessage}
                       disabled={!chatMessage.trim() || sendingMessage}
                     >
                       {sendingMessage ? '⏳' : '➤'}
                     </button>
                   </div>
                 </div>
               )}
             </>
           ) : (
             <div className="no-conversation-selected">
               <div className="empty-icon">💬</div>
               <h3>Select a conversation</h3>
               <p>Choose a conversation from the list to start messaging</p>
             </div>
           )}
         </div>
       </div>

      {composeMessage && (
        <div className="compose-modal">
          <div className="compose-content">
            <div className="compose-header">
              <h3>{isReply ? 'Reply to Message' : 'Compose New Message'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setComposeMessage(false);
                  setIsReply(false);
                  setReplyToMessage(null);
                }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSendMessage} className="compose-form">
              <div className="form-group">
                <label>To:</label>
                {isReply ? (
                  <div className="reply-recipient">
                    <span className="recipient-name">{newMessage.receiverName}</span>
                    <span className="recipient-role">({newMessage.receiverRole})</span>
                    {newMessage.studentName && (
                      <span className="recipient-student">- {newMessage.studentName}</span>
                    )}
                  </div>
                ) : (
                  <select
                    value={newMessage.receiverId}
                    onChange={(e) => {
                      const contact = availableContacts.find(c => c.id === e.target.value);
                      if (contact) handleContactSelect(contact);
                    }}
                    required
                  >
                    <option value="">Select recipient</option>
                    {availableContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} ({contact.role}) - {contact.studentName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  placeholder={t('common.enterMessageSubject')}
                  required
                />
              </div>

              {isReply && replyToMessage && (
                <div className="form-group">
                  <label>Original Message:</label>
                  <div className="original-message">
                    <div className="original-message-header">
                      <strong>{replyToMessage.senderName}</strong>
                      <span className="original-date">
                        {replyToMessage.timestamp?.toDate().toLocaleString()}
                      </span>
                    </div>
                    <div className="original-message-content">
                      {replyToMessage.content}
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                  placeholder={isReply ? "Type your reply here..." : "Type your message here..."}
                  rows={6}
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setComposeMessage(false);
                    setIsReply(false);
                    setReplyToMessage(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="send-btn"
                  disabled={sending}
                  style={{ 
                    background: '#667eea', 
                    color: 'white', 
                    border: '1px solid #667eea',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {sending ? 'Sending...' : (isReply ? 'Send Reply' : 'Send Message')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingSystem;
