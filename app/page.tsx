'use client';
import CreateFile from "@src/file";
import { appendContentFunction, } from "@src/file";
import { Directory } from "@src/directory";
import { File } from "@src/file";
import { useState, useRef } from "react";

export default function terminal() {
  var commandSent = useRef(false);
  const [userInput, setUserInput] = useState("");
  var commandIdentified = useRef(" ");

  const detectKey = (e: any) => {
    if (e.key == " " && !commandSent.current) {
      commandSent.current = true;
      detectCommand(userInput);
    } else if (e.key == 'Enter' && commandIdentified.current != " ") {
      const clean_input = document.getElementById('user_prompt') as HTMLInputElement;
      clean_input.value = "";
      console.log(commandIdentified.current);
      commandSent.current = false;
      setUserInput("");
      // here the command should be sent off somewhere else before cleaning it, same goes to the other times i do the line below
      commandIdentified.current = " "
    } else if (e.key == 'Enter' && commandIdentified.current == " ") {
      const clean_input = document.getElementById('user_prompt') as HTMLInputElement;
      clean_input.value = "";
      console.log("puerkesa de comando")
      commandSent.current = false;
      setUserInput("");
      // here the command should be sent off somewhere else before cleaning it, same goes to the other times i do the line below
      commandIdentified.current = " "
    } else if (e.key == 'Enter' && !commandSent.current) {
      const clean_input = document.getElementById('user_prompt') as HTMLInputElement;
      clean_input.value = "";
      console.log("puerkesa de comando")
      // here the command should be sent off somewhere else before cleaning it, same goes to the other times i do the line below
      commandIdentified.current = " "
    }
  }

  const detectCommand = (userInput: string): void => {
    console.log("el comando es: ", userInput);
    switch (userInput) {
      case "cat":
        commandIdentified.current = userInput;
        break;
      case "ls":
        commandIdentified.current = userInput;
        break;
      case "cd":
        commandIdentified.current = userInput;
        break;
      case "mkdir":
        commandIdentified.current = userInput;
        break;
      case "rmdir":
        commandIdentified.current = userInput;
        break;
      default:
        console.log("No Commands Detected");
        commandIdentified.current = " ";
        break;
    }
  }


  return (
    <div onKeyDown={detectKey}>
      <div id="prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-5">
        <div id="pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
          ~/some/direction {">"}&nbsp;
        </div>
        <form id="user_prompt_form">
          <input id="user_prompt" value={userInput} placeholder="cat README" autoFocus type="text" className="col-start-2 text-left text-3xl font-[Terminal] outline-none  caret_transparent" onChange={(e) => setUserInput(e.target.value)} />
        </form>
      </div>
    </div>
  )
}
