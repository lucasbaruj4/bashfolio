import Image from "next/image";

export default function Home() {
  return (
    <div>
      <h1 fontFamily="BBTerm">
        Hello you...
      </h1>
      <Image src="/dani.jpg" alt="daniel" width={400} height={400}/>
    </div>
  )
}
