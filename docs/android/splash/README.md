# Android 앱 로딩 이미지 (#149)

Android 앱(`nemo.app`)을 켤 때 나오는 로고를 웹 로딩 화면과 같은 크기·같은 그림으로 맞추기 위한 파일이다. Android 프로젝트는 이 저장소 밖에 있어서, 여기서는 파일과 값만 준비한다.

## 왜 바꾸나

Bubblewrap은 로딩 이미지를 300dp 캔버스로 만들고, 그 안에 테두리 상자가 꽉 찬 일반 아이콘(`public/images/icon-512.png`)을 넣는다. 그래서 휴대폰 화면 폭의 75~80%를 차지할 만큼 크다. 웹 로딩 화면(`src/app/components/LaunchSplash.tsx`)은 캐릭터 폭이 96dp(태블릿 120dp)다. 둘이 다르면 앱을 켤 때 큰 로고가 작은 로고로 한 번 바뀌어 보인다.

## 파일

| 파일                 | 크기      | 넣을 곳                                        |
| -------------------- | --------- | ---------------------------------------------- |
| `splash-mdpi.png`    | 300×300   | `app/src/main/res/drawable-mdpi/splash.png`    |
| `splash-hdpi.png`    | 450×450   | `app/src/main/res/drawable-hdpi/splash.png`    |
| `splash-xhdpi.png`   | 600×600   | `app/src/main/res/drawable-xhdpi/splash.png`   |
| `splash-xxhdpi.png`  | 900×900   | `app/src/main/res/drawable-xxhdpi/splash.png`  |
| `splash-xxxhdpi.png` | 1200×1200 | `app/src/main/res/drawable-xxxhdpi/splash.png` |
| `splash-mark.svg`    | 원본      | PNG를 다시 만들 때 쓴다                        |

모두 300dp 캔버스(흰 바탕) 가운데에 캐릭터 폭 96dp다. 캔버스 크기는 Bubblewrap이 만드는 것과 같으므로, 각 폴더의 `splash.png`를 이름만 바꿔 덮어쓰면 된다.

## 바꿀 값

- 로딩 이미지: 위 파일로 바꾼다.
- 배경색(`twa-manifest.json`의 `backgroundColor`): `#FFFFFF`. 웹 로딩 화면 바탕과 같아야 한다.
- 이미지 맞춤 방식: 기본값(가운데, 늘리지 않음 = `CENTER`)을 그대로 둔다. 늘리면 크기가 다시 달라진다.
- 흐려지며 사라지는 시간(`splashScreenFadeOutDuration`): 지금 값을 둔다. 웹 로딩 화면이 같은 그림으로 이어받으므로 이 값은 보이는 차이가 거의 없다.

## 주의

- `bubblewrap update`나 PWABuilder로 다시 만들면 로딩 이미지가 아이콘으로 다시 만들어진다. 다시 만든 뒤에는 위 파일을 다시 덮어쓴다.
- Android 12 이상은 앱을 켜는 순간 시스템 로딩 화면(앱 아이콘, 지름 160dp 원 안)이 먼저 잠깐 보인다. 거기서 캐릭터는 약 120dp라 96dp로 조금 작아진다. 같게 맞추려면 Android 12용 테마(`values-v31`)의 `android:windowSplashScreenAnimatedIcon`을 이 그림으로 바꾼다. 선택 사항이다([Android 로딩 화면 문서](https://developer.android.com/develop/ui/views/launch/splash-screen)).

## 다시 만들기

`splash-mark.svg`를 고친 뒤, 브라우저에서 300×300으로 그려 화면 밀도 배율(1, 1.5, 2, 3, 4)대로 PNG를 저장한다. 캐릭터 폭이나 그림을 바꾸면 웹 로딩 화면(`LaunchSplash.tsx`의 크기 클래스와 그림)도 함께 바꾼다.
