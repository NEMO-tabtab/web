import Image from "next/image";

function login() {
  return (
    <main className="h-screen bg-brand-3 flex flex-col justify-center items-center">
      <article className="w-1/2 h-3/4 flex justify-center items-center">
        <Image
          src="/logo.png"
          width={200}
          height={200}
          quality={100}
          className="w-full md:w-3/4"
          alt="제품 썸네일"
        />
      </article>
      <article className="w-3/4 md:w-1/2 h-1/4 grid grid-rows-2">
        <button className="h-fit py-3 md:py-5 w-full text-lg md:text-xl bg-white hover:bg-gray-300 font-bold py-2 px-4 rounded-full">
          카카오 로그인 부분
        </button>

        <button className="h-fit py-3 md:py-5 w-full text-lg md:text-xl bg-white hover:bg-gray-300 font-bold py-2 px-4 rounded-full">
          둘러보기
        </button>
      </article>
    </main>
  );
}

export default login;
