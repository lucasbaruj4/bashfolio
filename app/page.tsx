import Image from "next/image";

export default function Terminal() {

  return (
    <div id="prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-5">
      <div id="pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
        ~/some/direction {">"}&nbsp; 
      </div>
      <input id="user_prompt" placeholder="cat README" autoFocus type="text" className="col-start-2 text-left text-3xl font-[Terminal] outline-none  caret_transparent"  />
    </div>
  )
}
