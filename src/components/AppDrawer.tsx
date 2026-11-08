import React from 'react';
import { Drawer as AntDrawer } from 'antd';
import { useSiteTexts } from "@/components/SiteTextProvider";

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  contents: string[]
  bgColor?: string;
}

const AppDrawer: React.FC<AppDrawerProps> = ({ open, onClose, title, contents, bgColor }) => {
  const textos = useSiteTexts();
  
  return (
    <AntDrawer
      title={title}
      closable={{ 'aria-label': textos?.fecharPainel ?? 'Fechar painel' }}
      onClose={onClose}
      open={open}
      style={{ whiteSpace: 'pre-wrap', textAlign: 'justify', backgroundColor: bgColor ?? 'var(--site-accent)', fontSize: '16px'}}
>
      {contents.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </AntDrawer>
  );
};

export default AppDrawer;
