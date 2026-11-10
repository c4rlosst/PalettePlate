export function FoodArt({ id }: { id: string }) {
  let shape;
  switch (id) {
    case "kalabasa":
      shape = (
        <>
          <path d="M23 56a29 24 0 1 1 55 0Z" fill="currentColor" />
          <path d="M29 52a22 18 0 1 1 43 0Z" fill="#f4d28c" />
          <path d="M39 49a12 10 0 1 1 23 0Z" fill="#e6a35b" />
          <path d="m27 56 48 0" stroke="#557548" strokeWidth="4" />
        </>
      );
      break;
    case "talong":
      shape = (
        <>
          <path
            d="M64 20C82 33 67 61 36 65 11 67 19 55 34 49c17-7 10-25 30-29"
            fill="currentColor"
          />
          <path d="m55 24 7-12 9 10-3 9-8-7Z" fill="#58834a" />
          <path
            d="m62 14 4-9"
            stroke="#58834a"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "karot":
      shape = (
        <>
          <path d="M36 25q10-8 23 7L35 65q-5 4-4-3Z" fill="currentColor" />
          <path
            d="m43 25-4-14m11 14 8-15m-9 15 16-5"
            stroke="#648a4d"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="m36 39 10 4m-13 7 8 3" stroke="#f4d3a0" strokeWidth="3" />
        </>
      );
      break;
    case "papaya":
      shape = (
        <>
          <ellipse
            cx="50"
            cy="40"
            rx="23"
            ry="31"
            transform="rotate(28 50 40)"
            fill="currentColor"
          />
          <ellipse
            cx="50"
            cy="40"
            rx="18"
            ry="26"
            transform="rotate(28 50 40)"
            fill="#edaf71"
          />
          <ellipse
            cx="50"
            cy="40"
            rx="7"
            ry="18"
            transform="rotate(28 50 40)"
            fill="#4d4031"
          />
          <path
            d="m47 30 6 4m-10 5 9 4m-10 5 6 4"
            stroke="#d4c393"
            strokeWidth="2"
          />
        </>
      );
      break;
    case "mangga":
      shape = (
        <>
          <path
            d="M58 14c33 8 26 48-10 52-22 3-31-15-18-25 11-8 7-23 28-27"
            fill="currentColor"
          />
          <path
            d="M58 17q10-6 13-5"
            stroke="#5b7a45"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M41 44q-12 12 4 16"
            stroke="#fff2b5"
            strokeWidth="4"
            opacity=".55"
            fill="none"
          />
        </>
      );
      break;
    case "saging":
      shape = (
        <>
          <path d="M25 20c-6 36 21 57 53 28-28 9-38-6-41-29Z" fill="#c1a23c" />
          <path d="M34 16c1 31 17 43 42 28-25 3-30-12-30-27Z" fill="#d5bb5b" />
          <path d="m26 20 10-2m-2-2 12 1" stroke="#675738" strokeWidth="4" />
        </>
      );
      break;
    case "pakwan":
      shape = (
        <>
          <path d="M17 28h66a33 35 0 0 1-66 0" fill="#4e784c" />
          <path d="M22 28h56a28 29 0 0 1-56 0" fill="#e9e7bb" />
          <path d="M26 28h48a24 25 0 0 1-48 0" fill="currentColor" />
          <path
            d="m36 37 1 5m12-3 0 5m13-7-1 5m-12 10 0 4"
            stroke="#633f35"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "kanin":
      shape = (
        <>
          <path d="M22 43c0-25 56-25 56 0" fill="#e7e4da" />
          <path
            d="M18 41h64c-1 19-13 26-32 26S20 60 18 41"
            fill="currentColor"
          />
          <path
            d="M33 32h4m8-4h5m8 5h5m-18 3h4"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "pechay":
    case "sitaw":
    case "ampalaya":
    case "sayote":
      shape = (
        <>
          <path
            d="M49 66C20 54 15 27 32 19c13-6 19 9 19 9S55 7 69 16c22 16 4 43-20 50"
            fill="currentColor"
          />
          <path
            d="m49 66 4-39m-3 20-14-14m15 6 12-12"
            stroke="#b0c598"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "patatas":
    case "bawang":
      shape = (
        <>
          <path
            d="M29 27C39 9 68 17 75 38c9 24-14 30-35 25C16 59 19 43 29 27"
            fill="currentColor"
            opacity=".75"
          />
          <path
            d="m35 33 3-1m22 13 2 2m-24 7 3 0"
            stroke="#eadac4"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      );
      break;
    default:
      shape = (
        <>
          <path
            d="M50 28C22 8 13 45 33 62c7 6 12 5 17 3 5 2 11 3 18-4C88 42 77 9 50 28Z"
            fill="currentColor"
          />
          <path
            d="m50 28 3-16m-4 12c10-1 15-5 17-12-10-1-16 3-17 12"
            stroke="#557548"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M32 36q-6 9 0 16"
            fill="none"
            stroke="white"
            strokeWidth="4"
            opacity=".5"
            strokeLinecap="round"
          />
        </>
      );
  }
  return (
    <svg viewBox="0 0 100 80" aria-hidden="true">
      <ellipse
        cx="50"
        cy="71"
        rx="25"
        ry="3"
        fill="currentColor"
        opacity=".08"
      />
      {shape}
    </svg>
  );
}
