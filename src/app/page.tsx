import Main from "@/components/home/Main";
import Sobre from "@/components/home/Sobre";
import Agenda from "@/components/home/Agenda";
import Contato from "@/components/home/Contato";

export default function Home() {
  return (
    <div className="font-sans">

      <Main />
      <Sobre />
      <Agenda />
      <Contato />
      
    </div>
  );
}
