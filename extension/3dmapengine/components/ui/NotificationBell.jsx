import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const unreadAlarms = useMapStore(state => state.unreadAlarms);
  const alarmList = useMapStore(state => state.alarmList);
  const markAlarmRead = useMapStore(state => state.markAlarmRead);
  const setPanTarget = useMapStore(state => state.setPanTarget);
  
  // Phase 16: UI Container Layering
  const activeUI = useMapStore(state => state.activeUI);
  const bringToFront = useMapStore(state => state.bringToFront);
  const isFront = activeUI === 'notificationBell';

  const handleAlarmClick = (alarm) => {
    markAlarmRead(alarm.id);
    setIsOpen(false);
    if (alarm.x !== undefined && alarm.y !== undefined) {
      setPanTarget({ x: alarm.x, y: alarm.y });
    }
  };

  return (
    <div 
      onPointerDownCapture={() => bringToFront('notificationBell')}
      style={{ position: 'absolute', top: '20px', right: '20px', zIndex: isFront ? 9999 : 1000 }}
    >
      {/* The Bell Button */}
      <div style={{
        background: 'rgba(40, 41, 54, 0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '50%',
        width: '45px',
        height: '45px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.borderColor = '#00f2fe';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 242, 254, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
      }}
      onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ fontSize: '20px' }}>🔔</span>
        
        {/* Red Notification Badge */}
        {unreadAlarms > 0 && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: '#ff4757',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(255, 71, 87, 0.6)'
          }}>
            {unreadAlarms}
          </div>
        )}
      </div>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '55px',
          right: '0',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'rgba(25, 26, 35, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          padding: '10px'
        }}>
          <h3 style={{ margin: '0 0 10px 5px', color: '#00f2fe', fontFamily: 'Inter, sans-serif', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Tactical Alarms
          </h3>
          
          {alarmList.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#a4b0be', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
              No active alarms for your sector.
            </div>
          ) : (
            alarmList.map((alarm, i) => (
              <div key={alarm.id || i} 
                onClick={() => handleAlarmClick(alarm)}
                style={{
                  padding: '12px',
                  borderBottom: i === alarmList.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  background: alarm.isRead ? 'transparent' : 'rgba(255, 71, 87, 0.1)',
                  borderLeft: alarm.isRead ? '3px solid transparent' : '3px solid #ff4757',
                  transition: 'background 0.2s ease',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = alarm.isRead ? 'transparent' : 'rgba(255, 71, 87, 0.1)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: alarm.isRead ? '#dfe4ea' : '#fff', fontWeight: alarm.isRead ? 'normal' : 'bold', fontSize: '14px' }}>
                    {alarm.title || "Tactical Alert"}
                  </span>
                  <span style={{ fontSize: '11px', color: '#747d8c' }}>
                    {new Date(alarm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ color: '#a4b0be', fontSize: '12px' }}>
                  {alarm.message}
                </div>
                {alarm.x !== undefined && alarm.y !== undefined && (
                  <div style={{ color: '#00f2fe', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
                    🎯 [{alarm.x}, {alarm.y}]
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
