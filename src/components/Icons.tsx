import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';

export const Icon = ({ name, size = 24, color = "#9CA3AF" }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case 'settings': return <Svg {...props}><Circle cx="12" cy="12" r="3"/><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>;
    case 'user': return <Svg {...props}><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/></Svg>;
    case 'logOut': return <Svg {...props}><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline points="16 17 21 12 16 7"/><Line x1="21" y1="12" x2="9" y2="12"/></Svg>;
    case 'trash': return <Svg {...props}><Polyline points="3 6 5 6 21 6"/><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Svg>;
    case 'mail': return <Svg {...props}><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><Polyline points="22,6 12,13 2,6"/></Svg>;
    case 'lock': return <Svg {...props}><Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><Path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>;
    case 'help': return <Svg {...props}><Circle cx="12" cy="12" r="10"/><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Line x1="12" y1="17" x2="12.01" y2="17"/></Svg>;
    case 'info': return <Svg {...props}><Circle cx="12" cy="12" r="10"/><Line x1="12" y1="16" x2="12" y2="12"/><Line x1="12" y1="8" x2="12.01" y2="8"/></Svg>;
    case 'swing': return <Svg {...props}><Path d="M2 15c3.33-6 6.67-6 10 0s6.67 6 10 0"/><Path d="M17 5l5 0 0 5"/></Svg>;
    case 'arrowRight': return <Svg {...props}><Line x1="5" y1="12" x2="19" y2="12"/><Polyline points="12 5 19 12 12 19"/></Svg>;
    case 'arrowLeft': return <Svg {...props}><Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/></Svg>;
    case 'refresh': return <Svg {...props}><Polyline points="23 4 23 10 17 10"/><Polyline points="1 20 1 14 7 14"/><Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Svg>;
    case 'shield': return <Svg {...props}><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>;
    case 'thumbsUp': return <Svg {...props}><Path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></Svg>;
    case 'home': return <Svg {...props}><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline points="9 22 9 12 15 12 15 22"/></Svg>;
    case 'history': return <Svg {...props}><Path d="M3 3v5h5"/><Path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><Path d="M12 7v5l4 2"/></Svg>;
    case 'bell': return <Svg {...props}><Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Svg>;
    case 'bellDot': return <Svg {...props}><Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><Circle cx="18" cy="8" r="3" fill="#EF4444" stroke="none"/></Svg>;
    case 'star': return <Svg {...props}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
    case 'starFilled': return <Svg {...props} fill={color}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
    case 'calendar': return <Svg {...props}><Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><Line x1="16" y1="2" x2="16" y2="6"/><Line x1="8" y1="2" x2="8" y2="6"/><Line x1="3" y1="10" x2="21" y2="10"/></Svg>;
    case 'activity': return <Svg {...props}><Polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Svg>;
    case 'zap': return <Svg {...props}><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>;
    case 'pie': return <Svg {...props}><Path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><Path d="M22 12A10 10 0 0 0 12 2v10z"/></Svg>;
    case 'alert': return <Svg {...props}><Circle cx="12" cy="12" r="10"/><Line x1="12" y1="8" x2="12" y2="12"/><Line x1="12" y1="16" x2="12.01" y2="16"/></Svg>;
    case 'globe': return <Svg {...props}><Circle cx="12" cy="12" r="10"/><Line x1="2" y1="12" x2="22" y2="12"/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>;
    case 'chart': return <Svg {...props}><Line x1="18" y1="20" x2="18" y2="10"/><Line x1="12" y1="20" x2="12" y2="4"/><Line x1="6" y1="20" x2="6" y2="14"/></Svg>;
    case 'x': return <Svg {...props}><Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/></Svg>;
    case 'crown': return <Svg {...props}><Path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></Svg>;
    case 'play': return <Svg {...props} fill={color}><Polygon points="5 3 19 12 5 21 5 3"/></Svg>;
    // 👇 [추가됨] 공유하기 아이콘
    case 'share': return <Svg {...props}><Circle cx="18" cy="5" r="3"/><Circle cx="6" cy="12" r="3"/><Circle cx="18" cy="19" r="3"/><Line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><Line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Svg>;
    default: return null;
  }
};