import React from 'react';
import { Drawer as AntDrawer } from 'antd';

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  contents: string[]
}

const AppDrawer: React.FC<AppDrawerProps> = ({ open, onClose, title, contents }) => {
  
  return (
    <AntDrawer
      title={title}
      closable={{ 'aria-label': 'Close Button' }}
      onClose={onClose}
      open={open}
      style={{ backgroundColor: '#fd9917', fontSize: '16px'}}
>
      {contents.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </AntDrawer>
  );
};

export default AppDrawer;