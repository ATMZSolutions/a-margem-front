import React from "react";
import ContactItem from "../ContactItem";
import { AtSign, Instagram, Mail, Phone } from "lucide-react";

const Contato = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-[#412551] text-black">
      <div className="space-y-3 font-medium text-white">
        <ContactItem
          icon={
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
              <Phone size={18} color="#412551" />
            </span>
          }
          text="+55 (81) 9 8600-9096"
        />
        <ContactItem
          icon={
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
              <Mail size={18} color="#412551" />
            </span>
          }
          text="coletivoamargem1@gmail.com"
        />
        <ContactItem
          icon={
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
              <Instagram size={18} color="#412551" />
            </span>
          }
          text="@amargemcoletivo"
        />
        <ContactItem
          icon={
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
              <AtSign size={18} color="#412551" />
            </span>
          }
          text="@coletivoamargem"
        />
      </div>
    </section>
  );
};

export default Contato;
