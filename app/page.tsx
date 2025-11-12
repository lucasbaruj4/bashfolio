import Image from "next/image";

export default function Home() {
  return (
    <div id="prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-3">
      <div id="pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
        ~/some/direction {">"}&nbsp; 
      </div>
      <div id="user_prompt" className="col-start-2 text-left text-3xl font-[Terminal]">
         this_is_a_command
      </div>
    </div>
  )
}
