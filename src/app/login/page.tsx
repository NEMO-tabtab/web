function login() {
  return (
    <main className="h-screen bg-maincolor flex flex-col justify-center items-center">
      <article className="w-1/2 h-3/4 flex justify-center items-center">
        <div className="w-3/4 h-3/4 flex flex-col gap-1">
          <div className="h-1/2 flex justify-center items-end">
            <div className="relative bg-boxcolor h-80 aspect-square rounded-xl flex items-center justify-center translate-x-24">
              <div className="h-1/5 aspect-square absolute top-0 left-1/2 translate-x-[-50%] bg-minibox rounded-b-lg"></div>
              <h1 className="text-3xl font-bold">NEMO</h1>
            </div>
          </div>
          <div className="h-1/2 flex justify-center">
            <div className="h-1/2 w-3/4 flex gap-4">
              <div className="relative w-3/4 h-7/8 bg-boxcolor rounded-xl">
                <div className="h-1/5 aspect-square absolute top-0 left-1/2 translate-x-[-50%] bg-minibox rounded-b-lg"></div>
              </div>
              <div className="relative h-7/8 aspect-square bg-boxcolor rounded-xl">
                <div className="h-1/5 aspect-square absolute top-0 left-1/2 translate-x-[-50%] bg-minibox rounded-b-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </article>
      <article className="w-1/2 h-1/4 flex flex-col justify-around">
        <button className="h-1/5 text-xl bg-white hover:bg-gray-300 font-bold py-2 px-4 rounded-full">
          카카오 로그인 부분
        </button>

        <button className="h-1/5 text-xl bg-white hover:bg-gray-300 font-bold py-2 px-4 rounded-full">
          둘러보기
        </button>
      </article>
    </main>
  );
}

export default login;
