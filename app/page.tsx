'use client';
import CreateFile from "@src/file";
import { appendContent } from "@src/file";
import { useState } from "react";

export default function terminal() {
  const [userInput, setUserInput] = useState("");

  const detectKey = (e: any) => {
    if (e.key == "Enter") {
      userInputSent(userInput);
    }
  }

  const userInputSent = (userInput: string) => {
    console.log("el comando es: ", userInput);
  }


  return (
    <div onKeyDown={detectKey}>
      <div id="prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-5">
        <div id="pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
          ~/some/direction {">"}&nbsp;
        </div>
        <input id="user_prompt" placeholder="cat README" autoFocus type="text" className="col-start-2 text-left text-3xl font-[Terminal] outline-none  caret_transparent" onChange={(e) => setUserInput(e.target.value)} />
      </div>
    </div>
  )
}
