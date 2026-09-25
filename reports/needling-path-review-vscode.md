# 자침 경로 재검수 (VS Code용)

사용법
- Ctrl+Shift+V: 미리보기 / Ctrl+Shift+O: 혈 코드로 바로 이동 (예: `GB21` 입력)
- 각 혈의 `판정:` 줄만 고치면 됩니다. 예: `판정: 승인` / `판정: 반려 - 사유` / `판정: 보류`
- ⚠재확인 = txt에서 승인했지만 경로 분석상 치명·중대인 혈
- 이전 txt 판정은 "이전 txt 판정" 줄에 있습니다. 그대로면 판정 칸을 비워 두고, 바꿀 때만 새로 적으세요.
- 정렬: 치명 → 중대 → 보통 → 경미 → 양호 (같은 등급 안에서는 ⚠재확인 먼저)

## 🔴 치명 (31혈)

### CV22 [목·어깨윗부분] 🔴 치명 ⚠재확인
- 원문: 直刺 0.3～0.5寸 (深刺하여 氣管을 刺傷하지 말아야 한다) (모델 상한 8.5 mm)
- 기대 층: 복장목뿔근 사이 → 기관앞 지방 → 기관 (원문: 0.2~0.3寸 직자 후 복장뼈자루 뒤로 횡자)
- 문제: 45 mm까지 아무 구조 없음. 팔머리동맥 1.4 mm, 팔머리정맥 2 mm 근접 미표시
- 현재 경로: Trachea 45.4
- 빈 구간: 0→45mm(Trachea 앞)
- 근접 미표시: brachiocephalic vein 2mm옆@24; Brachiocephalic artery 1.4mm옆@30.9
- 근거: 원문 방향
- 제안: 원문 2단계 방향, 근접 혈관 표시
- 이전 txt 판정: 승인

판정: 반려-금침혈인데 그냥 자침 시뮬레이션 자체를 막아라.

### GV16 [목·어깨윗부분] 🔴 치명 ⚠재확인
- 원문: 直刺 0.3～0.5寸 (모델 상한 9.1 mm)
- 기대 층: 항인대 → (두반극근 사이) → 뒤고리뒤통수막 → 경막 → 대뇌소뇌수조·연수
- 문제: 4.3 mm에서 뒤통수뼈에 충돌. 항인대·막·경막·연수가 전혀 나오지 않아 가장 위험한 혈이 '뼈에서 멈춤'으로 보임
- 현재 경로: Occipital bone 4.3
- 방향 보정 시 (22° 편차): Occipital bone 4.6
- 근거: Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819: 피부→위험조직 MRI 평균 46 mm
- 제안: 위치(뒤통수뼈 아래 오목)와 방향(턱 쪽·약간 아래) 재설정, 항인대·경막·연수 깊이 표시
- 이전 txt 판정: 승인

판정: 두개골 융기쪽인데 도대체 연수, 항인대 막 이런게 왜 나오는지?

### SI16 [목·어깨윗부분] 🔴 치명 ⚠재확인
- 원문: 直刺 0.3～0.5寸 (모델 상한 9.1 mm)
- 기대 층: 흉쇄유돌근 뒤모서리 → 뒤삼각(지방·더부신경) → 어깨올림근/목갈비근
- 문제: 26 mm까지 공백(뒤삼각 지방 미모델), 더부신경 3.4 mm 근접 미표시, 주요 혈관 없음
- 현재 경로: scalenus medius 26.1 → Third cervical vertebra 29.5
- 방향 보정 시 (59° 편차): platysma 27.9 → platysma 70.7
- 빈 구간: 0→26mm(scalenus medius 앞)
- 근접 미표시: Accessory nerve (XI) 3.4mm옆@21.8
- 근거: Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819: 주요 혈관 18 mm
- 제안: 공백 라벨, 더부신경 근접 표시, 방향 40° 보정
- 이전 txt 판정: 승인 (제한적, 시뮬레이터는 전체 검수 돌려야할듯)

판정: 제안대로 진행해라. 더부신경은 현재 구현보다는 개념적으로 시뮬레이터에만 넣고, 나머지 혈관은 실제 구현을 고려해보겠다.

### ST9 [목·어깨윗부분] 🔴 치명 ⚠재확인
- 원문: 直刺 0.2～0.3寸 (不宜過深刺 혹 禁刺) (모델 상한 5.5 mm)
- 기대 층: 넓은목근 → 흉쇄유돌근 앞모서리 → 총경동맥(분기부) 바로 옆
- 문제: 경동맥이 반경 12 mm 안에 없음. 경로가 방패목뿔근·인두로 가서 위치가 후두 쪽으로 너무 안쪽
- 현재 경로: platysma 2.8 → thyrohyoid 15.5 → thyrohyoid membrane 17.9 → palatopharyngeus 45.3 → middle pharyngeal constrictor 47.2 → inferior pharyngeal constrictor 50.1 → Superior oblique part longus colli 56.6 → levator scapulae 79.1
- 방향 보정 시 (33° 편차): platysma 3.9 → middle pharyngeal constrictor 20.7 → Tongue 22.2 → superior pharyngeal constrictor 75.9
- 빈 구간: 19→45mm(palatopharyngeus 앞); 68→79mm(levator scapulae 앞)
- 근접 미표시: Epiglottis 2.1mm옆@26.5; middle pharyngeal constrictor 4.1mm옆@41.4; Sympathetic trunk 3.6mm옆@46.8; Ganglia of sympathetic trunk 2.9mm옆@46.8
- 근거: Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819: 주요 목혈관까지 16 mm
- 제안: 흉쇄유돌근 앞모서리로 위치 이동(검수 메모: C4 높이), 경동맥 표시
- 이전 txt 판정: 승인

판정: 위치 이동하고, 경동맥은 실제 구현하자.

### ST12 [목·어깨윗부분] 🔴 치명 ⚠재확인
- 원문: 直刺 0.3～0.5寸 (모델 상한 8.5 mm)
- 기대 층: 넓은목근 → (어깨목뿔근) → 상완신경얼기 줄기·빗장밑동맥 → 첫째갈비뼈/흉막꼭대기
- 문제: 빗장밑동맥 2 mm, 긴가슴신경 2.5 mm 근접 미표시. 상완신경얼기 줄기 없음
- 현재 경로: platysma 10.6 → serratus anterior 18.7 → external intercostal muscle 24.6 → first rib 24.7
- 빈 구간: 0→11mm(platysma 앞)
- 근접 미표시: suprascapular vein 4.2mm옆@9.1; suprascapular artery 4.3mm옆@13.1; subclavian artery 2mm옆@15.2; Long thoracic nerve 2.5mm옆@19.8; Intercostal nerves 4.1mm옆@27.4
- 근거: 해부
- 제안: 근접 표시
- 이전 txt 판정: 승인

판정: 빗장밑동맥만 위험표지물로 넣자. 근데, 긴가슴신경은 variation이 많은 편인지? 이게 실제로 긴가슴신경을 자극하거나 손상을 줄수 있는 근거를 달라.

### LR14 [가슴] 🔴 치명 ⚠재확인
- 원문: 直刺 0.2～0.3寸 (不宜深刺) (모델 상한 5.1 mm)
- 기대 층: 제6늑간 중쇄골선: 늑간근 → 흉막·폐 → 가로막 → 간
- 문제: 흉막·폐 없이 가로막 → 간
- 현재 경로: Abdominal part pectoralis major 3.2 → external oblique 6.2 → internal intercostal muscle 14.3 → rectus abdominis 14.4 → Diaphragm 25.6 → Hepatovenous segment VIII 31.1
- 근거: 해부
- 제안: 흉막 오목 정합
- 이전 txt 판정: 승인

판정: 큰가슴근 부분 (Abdominal part of right pectoralis major)이 랜더링이 잘못되어 있다. 흉막은 개념적으로 넣어두고, 추후 구현하자. 

### BL44 [등·허리] 🔴 치명 ⚠재확인
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: BL42와 같음
- 문제: 27 mm에서 견갑골 충돌
- 현재 경로: Ascending part trapezius 11 → rhomboid major 26.3 → scapula 27.2
- 빈 구간: 0→11mm(Ascending part trapezius 앞)
- 근접 미표시: dorsal scapular artery 2.9mm옆@30
- 근거: 같음
- 제안: 같음
- 이전 txt 판정: 승인

판정: 동일하게 진행해라. 

### BL10 [목·어깨윗부분] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (모델 상한 9.1 mm)
- 기대 층: (등세모근 가쪽 오목) → 머리널판근 → 두반극근 → 아래머리빗근
- 문제: 면 법선이 안쪽으로 기울어 38 mm에서 척추관·척수로 진입. 등세모근을 통과해 WHO 위치(등세모근 가쪽)보다 안쪽임
- 현재 경로: Descending part trapezius 13.2 → semispinalis capitis 20.5 → obliquus capitis inferior 22.5 → cervical rotator 29.2 → cervical rotator 30.7 → Axis 34.6
- 방향 보정 시 (82° 편차): Descending part trapezius 35.8 → Occipital bone 44.1
- 빈 구간: 0→13mm(Descending part trapezius 앞)
- 근거: WHO: 등세모근 가쪽 오목
- 제안: 위치 가쪽 이동, 방향 평균 법선 또는 앞쪽 수평
- 이전 txt 판정: 반려: 자침 가이드에서 극돌기 표시를 이상한 극돌기에 한다. C2 극돌기를 표시하라. 그리고 극돌기 횡돌기가 있는 모든 척추뼈들은 각각 라벨링을 해야될듯.

판정: 제안대로 이동하고, 정의에 맞는지 다시 확인. 

### GB20 [목·어깨윗부분] 🔴 치명
- 원문: 直刺 0.3～1寸 (반대쪽 眼球 방향으로 刺入) (모델 상한 18.3 mm)
- 기대 층: (흉쇄유돌근·등세모근 사이) → 머리널판근 → 두반극근 → 뒤통수밑근 → 척추동맥/막
- 문제: 방향이 평균 법선과 59° 어긋나 11.6 mm에서 뒤통수뼈 충돌. 원문 방향(반대쪽 눈) 미반영
- 현재 경로: semispinalis capitis 7.9 → obliquus capitis superior 9.3 → Occipital bone 11.6
- 방향 보정 시 (22° 편차): semispinalis capitis 9.2 → obliquus capitis superior 9.4 → Occipital bone 13.3
- 근거: Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819: 위험조직 50 mm
- 제안: 원문 방향 벡터 적용, 척추동맥·연수 거리 표시
- 이전 txt 판정: 반려: Location 설명 중 함요부->함몰부로 변경

판정: 반대쪽 눈 방향은 완전 정확할 필요는 없다. 그러나 뒤통수뼈 충돌 목표가 아니므로, 자침 시뮬레이터에 척추동맥/연수가 자침시 위험 구조물로 있다는 것을 표시하자. 

### GB21 [목·어깨윗부분] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 등세모근 → 어깨올림근/가시위근 → (폐꼭대기 흉막)
- 문제: 수직 경로가 흉막을 만나지 않고 77 mm에서 넷째갈비뼈. 등세모근(21 mm)~앞톱니근(47.7 mm) 27 mm 공백. 기흉 최다 혈인데 위험 표시 없음
- 현재 경로: Descending part trapezius 13 → serratus anterior 47.7 → subscapularis 60.4 → external intercostal muscle 66.2 → innermost intercostal muscle 76.6 → internal intercostal muscle 76.9 → fourth rib 76.9
- 빈 구간: 0→13mm(Descending part trapezius 앞); 21→48mm(serratus anterior 앞)
- 근접 미표시: dorsal scapular artery 0.5mm옆@24.4
- 근거: Chu 2018 초음파 https://doi.org/10.1155/2018/2308102 흉막 38.1±6.4 / Chen 2018 초음파 https://doi.org/10.1016/j.jams.2018.06.004 폐꼭대기 17.4(남) / Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819 56 mm
- 제안: 폐꼭대기·흉막 정합과 경로 재검토
- 이전 txt 판정: 반려: 가능하면 C7 극돌기점~견봉을 잇는 연한 선을 긋고, 중간 중점 표시바람.

판정: 기흉위협을 강조해서 넣을 것. 경로도 재검수해서 다시 넣자.

### GV15 [목·어깨윗부분] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (모델 상한 9.1 mm)
- 기대 층: 항인대 → 가시사이인대 → 황색인대(뒤고리중쇠막) → 경막 → 척수
- 문제: 등세모근 다음 36 mm에서 바로 경막·척수. 항인대·가시사이인대·황색인대 누락
- 현재 경로: Descending part trapezius 17.9 → Descending part trapezius 21.3 → Spinal dura 36.1
- 방향 보정 시 (36° 편차): Descending part trapezius 24.6 → Descending part trapezius 25 → Axis 26.1
- 빈 구간: 0→18mm(Descending part trapezius 앞); 25→36mm(Spinal dura 앞)
- 근접 미표시: Medulla oblongata 4.3mm옆@36.2
- 근거: Zhou 2019 MRI https://doi.org/10.13703/j.0255-2930.2019.06.014: 안전깊이 남 47.7±5.1 mm / Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819: 49 mm → 모델이 11~13 mm 얕음
- 제안: 검수 메모('둘째 목뼈인데 두개골에 있다') 위치 수정 선행, 정중선 인대층 표시
- 이전 txt 판정: 반려: 자침 가이드에서 나오는 뼈가 다른 뼈다.

판정: 인대층 표시 후 제안대로 수행해라. 그리고 현재 후두사근과 척추극돌기가 튀어나왔는데, 모델링도 해결해라.

### LI18 [목·어깨윗부분] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (모델 상한 9.1 mm)
- 기대 층: 넓은목근 → 흉쇄유돌근 → (깊이) 경동맥집·목정맥
- 문제: 경동맥·속목정맥이 반경 12 mm 안에 없음. 흉쇄유돌근 뒤 12 mm 공백 후 긴머리근·C3로 감. 넓은목근 누락. 혀인두신경 1.6 mm는 라벨 의심
- 현재 경로: sternocleidomastoid 8.2 → longus capitis 31.3 → anterior cervical intertransversarii 36 → Third cervical vertebra 46.1
- 빈 구간: 19→31mm(longus capitis 앞)
- 근접 미표시: Glossopharyngeal nerve (IX) 1.6mm옆@20.4; Accessory nerve (XI) 4.5mm옆@21.7; vertebral artery 2.3mm옆@40.7; Sympathetic trunk 3.8mm옆@42.5
- 근거: Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819: 주요 목혈관까지 13 mm
- 제안: 경동맥집 상대위치 확인, 근접 혈관 표시
- 이전 txt 판정: 반려: 자침 가이드의 갑상연골=>방패연골로 명칭 변경 필요.

판정: 경동맥과 속목정맥은 실제 구현할 가치가 있는 대형 혈관이긴 한데, 위치를 어디에다할건지? 큰 혈관도 변이가 클텐데.

### GB24 [가슴] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (不宜深刺) (모델 상한 8.5 mm)
- 기대 층: 제7늑간 중쇄골선: 늑간근 → 흉막(갈비가로막오목) → 가로막 → 간
- 문제: 흉막 없이 가로막 → 간(33.5 mm). 기흉 위험이 가려짐
- 현재 경로: external oblique 8.8 → internal intercostal muscle 17.7 → transversus abdominis 23.7 → Diaphragm 28.7 → Hepatovenous segment V 33.5
- 방향 보정 시 (22° 편차): external oblique 9.8 → internal intercostal muscle 18.6 → Diaphragm 33.8 → Hepatovenous segment V 39.1
- 근거: 해부: 흉막 하단은 중쇄골선 8번 갈비뼈
- 제안: 흉막 오목 정합
- 이전 txt 판정: 반려: 첩근과 동일한 자침 시뮬레이션 문제에, 가이드에 나오는 갈비뼈가 몇번째 갈비뼈인지 알려줄 것.

판정: 흉막은 추후 작업 모두 동일하다. 흉막은 구현하지 말고 개념적으로만 넣는다. 그리고, 자침 시뮬레이션 과정에서 위험 구조물로 또 넣어둔다. 

### LU2 [가슴] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (不宜深刺, 刺太深時 氣逆) (모델 상한 8.5 mm)
- 기대 층: 어깨세모근–큰가슴근 사이 → 빗장가슴근막 → 겨드랑동정맥·상완신경얼기 다발
- 문제: 큰가슴근 빗장부 → 작은가슴근 → 셋째갈비뼈. 가장 중요한 위험(겨드랑 다발) 근접 없음
- 현재 경로: Clavicular part pectoralis major 12.6 → cephalic vein 13.9 → Lateral pectoral nerve 16.5 → pectoralis minor 36.2 → third rib 45.8
- 빈 구간: 0→13mm(Clavicular part pectoralis major 앞); 26→36mm(pectoralis minor 앞)
- 근접 미표시: lateral thoracic artery 2.6mm옆@46.6
- 근거: 해부
- 제안: 위치(검수 메모: 쇄골에 더 붙게) 수정 선행
- 이전 txt 판정: 반려: 위치부터 취혈 가이드까지 다 틀림. 세모가슴삼각 정의: 오훼돌기, 대흉근, 빗장뼈 부분 사이의 삼각형 모양. 취혈 가이드에서는 위 3개가 나와야하고, 위치는 빗장뼈에 가깝고, 정중선에서 6촌이다.

판정: 겨드랑 다발을 위험 구조물로 자침 시뮬레이터에다가 표시해둬라. 

### BL42 [등·허리] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: (견갑골 벌린 임상 자세) 등세모근 → 마름근 → 엉덩갈비근 → 늑간 → 흉막
- 문제: 34 mm에서 견갑골 충돌 → 기흉 최다 부위(바깥줄)의 흉막 위험이 뼈로 가려짐
- 현재 경로: Ascending part trapezius 11.9 → rhomboid minor 32.1 → scapula 34.2
- 방향 보정 시 (17° 편차): Ascending part trapezius 12.5 → scapula 37.4
- 빈 구간: 0→12mm(Ascending part trapezius 앞)
- 근접 미표시: dorsal scapular artery 1.8mm옆@32.7
- 근거: 해부·자세
- 제안: 자세 표기 또는 견갑골 벌림 가정 경로
- 이전 txt 판정: 반려: 자침 가이드에서 주황색 강조된 뼈가 T1. 극돌기 자체는 맞음.

판정: 여기는 견갑골 타겟을 하지 않는다. 하지만 기흉 위협은 있으므로, 자침 시뮬레이터상으로 견갑골을 넣지 않되, 위험 구조물로 흉막을 넣어둬라. 

### BL43 [등·허리] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: BL42와 같음
- 문제: 35 mm에서 견갑골 충돌
- 현재 경로: Ascending part trapezius 13.1 → infraspinatus muscle 31.7 → scapula 35.3
- 방향 보정 시 (16° 편차): Ascending part trapezius 13.4 → rhomboid major 33.2 → longissimus thoracis 37.3 → external intercostal muscle 47 → fifth rib 47
- 빈 구간: 0→13mm(Ascending part trapezius 앞)
- 근거: 같음
- 제안: 같음
- 이전 txt 판정: 반려: 자침 가이드 주황색 강조 T1. 극돌기 표시 자체는 맞음.

판정: 여기는 견갑골 타겟을 하지 않는다. 하지만 기흉 위협은 있으므로, 자침 시뮬레이터상으로 견갑골을 넣지 않되, 위험 구조물로 흉막을 넣어둬라. 

### GV11 [등·허리] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 정중선 인대층
- 문제: 방향이 가쪽으로 기울어 56.9 mm에서 폐
- 현재 경로: multifidus 10.1 → splenius cervicis 13 → Ascending part trapezius 13.3 → spinalis thoracis 15.9 → semispinalis thoracis 21.3 → Lower lobe lung 56.9
- 방향 보정 시 (22° 편차): Ascending part trapezius 12.6 → splenius cervicis 13.4 → spinalis thoracis 16.3 → Supraspinous ligament 16.9 → semispinalis thoracis 22.1 → Sixth thoracic vertebra 25.8
- 빈 구간: 0→10mm(multifidus 앞); 25→57mm(Lower lobe lung 앞)
- 근접 미표시: Sympathetic nerves 2mm옆@34; Intercostal nerves 3.5mm옆@50.8; anterior intercostal veins 2.4mm옆@58.2
- 근거: 해부
- 제안: 방향

판정: 방향은 가쪽으로 기운게 틀린게 맞다. 이를 정확히 보정. 

### LR11 [배·샅] 🔴 치명
- 원문: 直刺 0.3～0.7寸 (모델 상한 20.8 mm)
- 기대 층: 긴모음근 가쪽 모서리 → 긴·짧은모음근 (가쪽에 넙다리혈관)
- 문제: 넙다리동맥 관통 @17.8
- 현재 경로: femoral artery 17.8 → pectineus 28.4 → deep femoral vein 36.8
- 방향 보정 시 (47° 편차): femoral artery 23.5 → pectineus 28 → deep femoral vein 29.4 → hip bone 56.7
- 빈 구간: 0→18mm(femoral artery 앞)
- 근접 미표시: Saphenous nerve 1.6mm옆@27.5; Femoral nerve 2.9mm옆@36.9; medial circumflex femoral vein 4.6mm옆@45.2
- 근거: 해부
- 제안: 위치 안쪽 이동

판정:

### SP12 [배·샅] 🔴 치명
- 원문: 直刺 0.5～0.7寸 (動脈을 피하여 刺鍼) (모델 상한 15.6 mm)
- 기대 층: 샅고랑 넙다리동맥 가쪽: 넙다리신경 바로 아래
- 문제: 넙다리동맥·신경 근접 없음. 복벽 → 엉덩근 → 샅고랑인대 위 위치
- 현재 경로: internal oblique 20.4 → transversus abdominis 23.6 → iliacus 46.7 → femur 67
- 방향 보정 시 (26° 편차): internal oblique 19.5 → transversus abdominis 24.3 → iliacus 54.1 → hip bone 73.4
- 빈 구간: 0→20mm(internal oblique 앞); 27→47mm(iliacus 앞)
- 근거: 원문: 動脈을 피하여
- 제안: 위치·근접 표시
- 이전 txt 판정: 반려:  기충과 같은 높이로, 조금만 올리면 될듯

판정: 방향 보정 이후에, 관련 넙다리 동맥/신경을 위험 구조물로 넣어둘 것. 

### SI12 [어깨·견갑] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 등세모근 → 가시위근 → 가시위오목(뼈), 바닥 근처 어깨위신경·혈관
- 문제: 견갑골을 비껴 상완신경얼기(79~92 mm)·겨드랑동맥(109 mm)까지 감
- 현재 경로: Ascending part trapezius 15.4 → supraspinatus 34.6 → omohyoid 42.3 → Posterior division of superior trunk of brachial plexus 79.1
- 방향 보정 시 (30° 편차): Ascending part trapezius 13.2 → scapula 22.2
- 빈 구간: 0→15mm(Ascending part trapezius 앞); 56→79mm(Posterior division of superior trunk of brachial plexus 앞)
- 근접 미표시: Suprascapular nerve 2.9mm옆@67.5
- 근거: 해부
- 제안: 위치·방향 수정, 뼈 정지
- 이전 txt 판정: 반려: 극상근 지나지 않냐 자침 시뮬레이터상으로. KCMRIC 말고도 직자 깊이좀 다시 찾아봐라.

판정: 상완신경얼기나 겨드랑동맥 깊이까지 들어갈 수 없다. 그냥 시뮬레이터 자침 상한 밑에 존재한다고 넣으면 될거같은데? 누가 침을 100mm 넣냐

### HT1 [위팔·팔꿈치] 🔴 치명
- 원문: 直刺 0.2～0.5寸 (上向하여 겨드랑이로 향해) (모델 상한 10 mm)
- 기대 층: (팔 벌림) 겨드랑 지방 → 겨드랑근막 → 겨드랑동정맥·상완신경얼기 다발
- 문제: 41 mm까지 아무 구조 없이 위팔뼈. 겨드랑동맥·신경다발 없음. 원문 방향(위쪽 겨드랑이) 미반영
- 현재 경로: humerus 40.9
- 빈 구간: 0→41mm(humerus 앞)
- 근거: 원문: 혈관·신경 주의
- 제안: 자세·방향 반영, 다발 표시

판정: 자세는 Osim 이후 넣는다. 다발은 자침 상한 밑에 존재한다고만 넣으면 되지 않나? 

### HT2 [위팔·팔꿈치] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (臂內側에서 外側으로) (모델 상한 10 mm)
- 기대 층: 안쪽두갈래근고랑: 자쪽피부정맥 → 위팔동맥·정중신경·자신경
- 문제: 면 법선이 87° 어긋나 사실상 피부와 평행. 위팔동맥 3.6 mm 근접 미표시
- 현재 경로: Short head biceps brachii 9.8 → brachialis 15.7 → humerus 32.8
- 근접 미표시: brachial artery 3.6mm옆@18
- 근거: 원문 방향: 안쪽→가쪽
- 제안: 방향 재설정(팔–몸통 접촉부 법선 오류)

판정: 방향 재수정하고, 위팔동맥이 근처에 존재할 수 있다는 경고를 자침 시뮬레이터에 넣자. 근데 지나는 구조물로 표시하는건 아닌 거 같긴 한데 의견은 어떤지. 

### LI13 [위팔·팔꿈치] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (혈관을 피하여 鍼尖을 臂外面에서 內側面을 향해 刺入) (모델 상한 10 mm)
- 기대 층: 위팔세갈래근 가쪽갈래 → 노신경(나선고랑)
- 문제: 현재 면 법선 경로는 노신경과 멀지만 평균 법선(27° 차이) 경로는 노신경 교차 @33.7. 방향이 위험 표시를 좌우함
- 현재 경로: brachialis 13.2 → humerus 37.4
- 방향 보정 시 (27° 편차): Lateral head triceps brachii 30.4 → Radial nerve 33.7 → Long head triceps brachii 61
- 빈 구간: 0→13mm(brachialis 앞)
- 근거: Tang & Cheng 2019 초음파 https://doi.org/10.1089/acu.2019.1335: LI13에서 초음파로 노신경 자입 확인
- 제안: 방향 보정 후 노신경 표시

판정: 방향을 전면 재수정하고, 노신경을 타겟하는 건 아니기 때문에 이런 구조물을 조심하라고 넣는걸 제안한다. 

### PC3 [위팔·팔꿈치] 🔴 치명
- 원문: 直刺 0.5～1寸(不宜深刺) (모델 상한 20 mm)
- 기대 층: 두갈래근널힘줄 → 위팔근, 바로 안쪽에 위팔동맥·정중신경
- 문제: 위팔동맥 2.3 mm @18.6 근접 미표시. 정중신경 없음. 두갈래근 힘줄·널힘줄 미모델
- 현재 경로: brachialis 19.2 → humerus 36.4
- 빈 구간: 0→19mm(brachialis 앞)
- 근접 미표시: medial brachial vein 4mm옆@13; brachial artery 2.3mm옆@18.6
- 근거: 원문: 不宜深刺
- 제안: 근접 표시

판정: 위팔동맥 근접 표시 ㄱㄱ

### SI8 [위팔·팔꿈치] 🔴 치명
- 원문: 直刺 0.2～0.5寸 (모델 상한 11.2 mm)
- 기대 층: 자신경고랑 (자신경 바로 위)
- 문제: 자신경이 8 mm 밖. 세갈래근 → 위팔뼈
- 현재 경로: Long head triceps brachii 15 → Medial head triceps brachii 17.4 → humerus 43
- 빈 구간: 0→15mm(Long head triceps brachii 앞)
- 근거: 해부
- 제안: 위치 확인(검수 메모: 팔꿈치 중앙에 가까움)

판정: 자신경고랑을 자침 경로에 들어갈 수 있다고 넣어두자. (이게 해부학적으로 맞는지는 다시 검색해서 넣어라, KCMRIC 기준.) 

### BL36 [넓적다리] 🔴 치명
- 원문: 直刺 0.5～1.5寸 (모델 상한 33.4 mm)
- 기대 층: 큰볼기근 아래모서리 → 넙다리두갈래근 긴갈래·반힘줄근 기시 → (깊이) 궁둥신경
- 문제: 궁둥신경 근접 없음, 뒤넙다리근 기시 누락, 큰볼기근 → 큰모음근
- 현재 경로: gluteus maximus 35.9 → adductor magnus 66.8
- 빈 구간: 0→36mm(gluteus maximus 앞); 43→67mm(adductor magnus 앞)
- 근거: 해부
- 제안: 검수 메모(큰볼기근 밑 모서리) 반영

판정: 참고용으로 넣으면 좋을 듯 하다. 궁둥신경은 위험 구조물로 따로 표시하고, 햄스트링은 아마 타겟하는 거로 알고 있는데 경로에 넣어라. 

### LR9 [넓적다리] 🔴 치명
- 원문: 直刺 0.5～0.7寸 (모델 상한 15.6 mm)
- 기대 층: 두덩정강근·넙다리빗근 사이 → 큰모음근 (모음근틈새 부근 넙다리혈관)
- 문제: 넙다리동맥 관통 @28.9, 넙다리정맥 @39.7 — 실제 위험이지만 위치가 넙다리빗근 위(0 mm)
- 현재 경로: sartorius 0 → adductor magnus 13.2 → femoral artery 28.9 → femoral vein 39.7 → adductor magnus 40.3 → popliteal vein 40.9 → femur 49.6
- 빈 구간: 1→13mm(adductor magnus 앞)
- 근접 미표시: Saphenous nerve 2.4mm옆@16
- 근거: 해부
- 제안: 위치 확인, 위험 표시 유지

판정: 넙다리정맥을 관통하는 자침은 불가능하므로, 위험 구조물로 넣어놓고 타겟하지 않는다라고 강조해야될듯. 넙다리 빗근쪽이다. 위치 자체는 맞음. 

### SP11 [넓적다리] 🔴 치명
- 원문: 直刺 0.3～0.5寸 (動脈을 피하여 刺鍼) (모델 상한 11.1 mm)
- 기대 층: 넙다리빗근·긴모음근 사이 (깊이 모음근관 넙다리동정맥)
- 문제: 넙다리동맥 근접 없음, 넙다리빗근 누락
- 현재 경로: adductor longus 12.7 → adductor brevis 40.4 → adductor magnus 51.4 → adductor brevis 69.3
- 방향 보정 시 (42° 편차): gracilis 9.9 → adductor magnus 21.5 → semimembranosus 65.4
- 빈 구간: 0→13mm(adductor longus 앞)
- 근거: 원문: 動脈을 피하여 / 검수 메모: 위쪽 1/3
- 제안: 위치 수정 선행

판정: 넙다리동맥이 뛰는 곳을 타겟한다고 했으므로, 심부 구조물에 넙다리동맥이 있다고 강조해서 넣는 것이 좋겠다. 자침 시뮬레이터 상한선 아래에 존재할 것으로 알고 있다. 

### BL39 [무릎·오금] 🔴 치명
- 원문: 直刺 0.3～1寸 (모델 상한 23.8 mm)
- 기대 층: 넙다리두갈래근 힘줄 안쪽 → 온종아리신경
- 문제: 온종아리신경 미표시, 정강신경 교차
- 현재 경로: Lateral head gastrocnemius 16.8 → plantaris 31.3 → Tibial nerve 37.2 → tibia 67.9
- 빈 구간: 0→17mm(Lateral head gastrocnemius 앞); 49→68mm(tibia 앞)
- 근접 미표시: popliteal artery 1.8mm옆@47.1
- 근거: 해부
- 제안: 온종아리신경 정합·표시

판정: 위치가 일단 잘못됬다. Long head of right biceps femoris 바로 안쪽에 붙여야된다. 그리고 오금주름선 라인으로 다시 잡아야 한다. 온종아리신경에 주변에 존재한다고 넣고, 그리고 위치 자체가 위험구역이므로 이건 별도 표시한다. 

### BL40 [무릎·오금] 🔴 치명
- 원문: 直刺 0.6～1.5寸 (모델 상한 35.7 mm)
- 기대 층: 오금 지방 → 정강신경(가장 얕음) → 오금정맥 → 오금동맥(가장 깊음)
- 문제: 장딴지근 두 갈래를 지나고 정강신경 7.4 mm 밖, 오금동맥 0.8 mm 옆 @50.8
- 현재 경로: small saphenous vein 21.8 → Medial head gastrocnemius 23.5 → Lateral head gastrocnemius 25.9 → plantaris 33.4 → tibia 60.6
- 빈 구간: 0→22mm(small saphenous vein 앞); 46→61mm(tibia 앞)
- 근접 미표시: popliteal artery 0.8mm옆@50.8
- 근거: Hou 2020 MRI https://doi.org/10.1177/0964528420958714: 70% 안전깊이 18.5 mm → 동맥 약 26 mm (모델 약 2배)
- 제안: 오금 정합, 신경혈관다발 표시

판정: 오금주름 위에 있으야 하므로, 체표에 오금주름, 팔꿈치주름은 조금 가시성 있게 표시하고 이에 맞게 올려라. 그리고 신경혈관다발이 존재하는 위험구역이므로 이는 별도 표시하자. 그리고 강조해라. 

### GB34 [무릎·오금] 🔴 치명
- 원문: 0.8～1.2寸 直刺 (모델 상한 26.7 mm)
- 기대 층: 긴종아리근/긴발가락폄근 → (온종아리신경 분지)
- 문제: 종아리신경 분지 미표시, 긴종아리근 누락, 뼈사이막 통과 후 오금정맥·동맥(37~46 mm)
- 현재 경로: extensor digitorum longus 21.1 → Interosseous membrane leg 31.9 → soleus 35.4 → popliteal vein 37.7 → popliteal artery 45.7 → popliteus 48.5 → Medial head gastrocnemius 78
- 빈 구간: 0→21mm(extensor digitorum longus 앞)
- 근거: Park & Kim 2013: 혈관·신경 21.2 mm(구조명 미확인)
- 제안: 신경 정합·표시

판정: 종아리신경 분지가 있는건 너무 다양하니까, 긴종아리근은 표시하고, 오금정맥, 동맥은 상한선 밑에 존재할 수 있다고 넣어둬라. 어차피 오금정맥 동맥까지 자침 불가능하다. 

## 🟠 중대 (71혈)

### CV15 [가슴] 🟠 중대 ⚠재확인
- 원문: 直刺 0.3～0.5寸 (모델 상한 14.9 mm)
- 기대 층: 칼돌기 끝 아래: 백색선 → 간 (위로 심장)
- 문제: 3.7 mm에서 칼돌기 충돌
- 현재 경로: Xiphoid process 3.7
- 근거: Cheng 2012(초록): 안전깊이 약 17~25 mm, 정의는 원문 확인 필요
- 제안: 검수 메모('칼돌기 끝') 위치 수정
- 이전 txt 판정: 승인

판정:

### CV1 [배·샅] 🟠 중대 ⚠재확인
- 원문: 直刺 0.3～1寸 (鍼灸甲乙經 : 2寸) (모델 상한 29.7 mm)
- 기대 층: 회음중심 → 망울해면체근 → 항문올림근
- 문제: 방향 63°로 복강 쪽 102 mm
- 현재 경로: (구조 없음)
- 근거: 해부
- 제안: 방향 보정
- 이전 txt 판정: 승인

판정: 방향 보정해라. 

### SI15 [목·어깨윗부분] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 등세모근 → 어깨올림근/작은마름근 → 위뒤톱니근 → 목널판근 → 엉덩갈비근
- 문제: 방향 54~63° 편차로 T3 척추체(65 mm) 쪽으로 감
- 현재 경로: Transverse part trapezius 17.3 → rhomboid major 38.9 → multifidus 39.2 → splenius capitis 42 → serratus posterior superior 44.1 → splenius cervicis 48.1 → semispinalis thoracis 51.9 → Third thoracic vertebra 65.2
- 방향 보정 시 (54° 편차): Transverse part trapezius 12.6 → levator scapulae 34.9 → iliocostalis cervicis 45.1 → serratus posterior superior 46.5 → levatores costarum longi 55.6 → external intercostal muscle 58.8 → Pleura 71.1
- 빈 구간: 0→17mm(Transverse part trapezius 앞); 25→39mm(rhomboid major 앞)
- 근거: Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819: 88 mm
- 제안: 방향 보정
- 이전 txt 판정: 반려: 자침이 직자가 아니라 횡자/사자 수준이다.

판정: 방향 보정해라. 

### ST10 [목·어깨윗부분] 🟠 중대
- 원문: 直刺 0.3～0.4寸 (外方에서 內側을 향하여 刺入) (모델 상한 7.3 mm)
- 기대 층: 흉쇄유돌근 앞모서리 → 어깨목뿔근·복장목뿔근 → 깊이 경동맥
- 문제: 21 mm에서 방패연골 충돌 → 위치가 후두 위
- 현재 경로: platysma 3.1 → sternohyoid 14.2 → sternothyroid 19.8 → Thyroid cartilage 21.3
- 근거: 해부
- 제안: 흉쇄유돌근 앞모서리로 이동
- 이전 txt 판정: 반려: 자침 가이드의 윤상연골을 반지연골로 변경할 것. *추신: 깨물근이 랜더링이 길어보이는데, 어떻게 생각하는지?

판정: 방패연골까지 갈 이유가 없는데, 그건 상한선 이후 위험 구조물로 처리하면 되는 거 아닌가? 후두 충돌은 수정해라. 

### ST11 [목·어깨윗부분] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 9.1 mm)
- 기대 층: 넓은목근 → 흉쇄유돌근 두 갈래 사이 → 복장목뿔근 → 속목정맥·팔머리정맥 → 흉막꼭대기
- 문제: 팔머리정맥 교차 @14.8(위험 표시는 적절)인데 복장목뿔근이 정맥보다 깊게 나옴 → 메시 겹침/순서 오류
- 현재 경로: platysma 0.4 → sternocleidomastoid 3 → brachiocephalic vein 14.8 → sternohyoid 18.5 → Pleura 42
- 빈 구간: 26→42mm(Pleura 앞)
- 근접 미표시: internal jugular vein 1.5mm옆@24.5; subclavian vein 1.2mm옆@25.1; common carotid artery 4.1mm옆@28.3; Brachiocephalic artery 5mm옆@37.1; subclavian artery 1.2mm옆@41.5
- 근거: 해부
- 제안: 정합 수정
- 이전 txt 판정: 반려: 자침 시뮬레이터에서 Right Platysma에 한국말도 병용해라.

판정: 랜더링 이슈를 수정하고 자침 시뮬레이션에도 반영해라. 

### GB22 [가슴] 🟠 중대
- 원문: 直刺 0.2～0.3寸 (不宜深刺) (모델 상한 6 mm)
- 기대 층: (팔 듦) 중간겨드랑선 제4늑간: 앞톱니근 → 늑간근 → 흉막
- 문제: 큰가슴근 → 넷째갈비뼈. 앞톱니근 누락
- 현재 경로: Abdominal part pectoralis major 28.3 → fourth rib 57.8
- 빈 구간: 0→28mm(Abdominal part pectoralis major 앞); 33→58mm(fourth rib 앞)
- 근접 미표시: lateral thoracic vein 0.9mm옆@41.3; lateral thoracic artery 1.7mm옆@49.1; Posterior intercostal arteries 2.7mm옆@58.1; Intercostal nerves 4.6mm옆@62.1; anterior intercostal veins 1.1mm옆@62.3
- 근거: 해부
- 제안: 자세·늑간 반영
- 이전 txt 판정: 반려: 위치가 늑간이 아니라 상완에 찍힘. 아예 경로가 틀린 중대 문제.

판정: 팔 든 상태를 가정하고, 실제 구현하지는 않지만 선을 그어 4늑간 사이에 표시해라. 현재 흉부로 이동은 했지만, 이에 대한 추가수정이 필요하다. 

### GB23 [가슴] 🟠 중대
- 원문: 直刺 0.2～0.3寸 (不宜深刺) (모델 상한 5.1 mm)
- 기대 층: 제4늑간: 앞톱니근 → 늑간근 → 흉막
- 문제: 배바깥빗근 → 다섯째갈비뼈. 앞톱니근 누락, 시드가 피부에서 13 mm
- 현재 경로: external oblique 28.6 → external intercostal muscle 34.8 → fifth rib 36.5
- 빈 구간: 0→29mm(external oblique 앞)
- 근접 미표시: Posterior intercostal arteries 0.4mm옆@38.4; anterior intercostal veins 0.9mm옆@39.6
- 근거: 해부
- 제안: 늑간 스냅
- 이전 txt 판정: 반려: 늑간근을 지나야되는 것으로 판단되는데 경로에 늑간근이 없다. 내가 맞는지 몰라서 재검수 요망.

판정: 표시 누락된 것들을 수정해라. 

### KI22 [가슴] 🟠 중대
- 원문: 直刺 0.2～0.3寸 (모델 상한 5.1 mm)
- 기대 층: 제5늑간
- 문제: 다섯째갈비연골 충돌
- 현재 경로: Sternocostal part pectoralis major 4.6 → fifth costal cartilage 15.8
- 근거: 해부
- 제안: 늑간 스냅
- 이전 txt 판정: 반려: 자침 시뮬레이션이 실제 5번째 늑간사이를 가르키지 못함.

판정: 

### KI25 [가슴] 🟠 중대
- 원문: 直刺 0.3～0.4寸 (不可深刺) (모델 상한 6.8 mm)
- 현재 경로: Sternocostal part pectoralis major 6.4 → Pleura 37.5
- 방향 보정 시 (28° 편차): Sternocostal part pectoralis major 6.9 → third costal cartilage 20.2
- 빈 구간: 24→38mm(Pleura 앞)
- 이전 txt 판정: 반려: 영허와 동일한 미세 수정 필요. 둘다 조금 올리면 될 듯.

판정: 

### KI26 [가슴] 🟠 중대
- 원문: 直刺 0.2～0.4寸 (不可深刺) (모델 상한 6.8 mm)
- 기대 층: 제1늑간
- 문제: 둘째갈비연골 충돌
- 현재 경로: Sternocostal part pectoralis major 7 → second costal cartilage 19.6
- 근거: 해부
- 제안: 늑간 스냅
- 이전 txt 판정: 반려: 자침 시뮬레이터 바에서 상한선에서 끝나야되는데 안끝남. 뭔가 순서가 꼬인듯하다.

판정: 

### ST14 [가슴] 🟠 중대
- 원문: 直刺 0.2～0.3寸 (모델 상한 5.1 mm)
- 기대 층: 제1늑간: 큰가슴근 → 늑간근 → 흉막
- 문제: 면 법선 90° 오류, 둘째갈비뼈 충돌 → 늑간 위치 아님
- 현재 경로: Sternocostal part pectoralis major 13.8 → second rib 28.3
- 빈 구간: 0→14mm(Sternocostal part pectoralis major 앞)
- 근거: 해부
- 제안: 늑간 스냅, 방향 보정
- 이전 txt 판정: 반려: 자침 시뮬레이터 상에서 1번째 늑간보다 아래쪽에 현재 구성되어있다.

판정: 

### ST15 [가슴] 🟠 중대
- 원문: 直刺 0.2～0.3寸 (不宜深刺) (모델 상한 5.1 mm)
- 기대 층: 제2늑간: 큰가슴근 → 늑간근 → 흉막
- 문제: 셋째갈비뼈 충돌 → 늑간 위치 아님
- 현재 경로: Sternocostal part pectoralis major 9.9 → third rib 31.6
- 근거: 해부
- 제안: 늑간 스냅
- 이전 txt 판정: 반려: 경로상에 대흉근을 만나지 않는지?

판정: 

### ST16 [가슴] 🟠 중대
- 원문: 直刺 0.2～0.3寸 (不可深刺) (모델 상한 5.1 mm)
- 기대 층: 제3늑간
- 문제: 면 법선 84° 오류
- 현재 경로: Sternocostal part pectoralis major 3.4 → external intercostal muscle 29.1 → internal intercostal muscle 30.9 → Pleura 45.3
- 빈 구간: 33→45mm(Pleura 앞)
- 근접 미표시: Lateral pectoral nerve 4.5mm옆@8.1
- 근거: 해부
- 제안: 방향 보정
- 이전 txt 판정: 승인

판정: 방향 보정해라. 

### BL22 [등·허리] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 넓은등근 널힘줄/흉요근막 → 척추세움근(가장긴근·뭇갈래근) → 가로돌기 사이 → 큰허리근
- 문제: 허리네모근이 척추세움근과 겹쳐 앞이 아닌 층으로 나옴. 뭇갈래근 누락
- 현재 경로: latissimus dorsi 6.8 → serratus posterior inferior 13.6 → longissimus thoracis 31 → quadratus lumborum 43.4 → Second lumbar vertebra 62.5
- 빈 구간: 52→63mm(Second lumbar vertebra 앞)
- 근거: 요추 MRI 2020 https://doi.org/10.1016/j.imr.2020.100679: 피부→L1 가로돌기 45 mm (모델 L2 척추 62.5 mm)
- 제안: 허리네모근 정합
- 이전 txt 판정: 승인

판정: 허리네모근 정합하는데, 자침 상한선 훨씬 뒤에 있는거 아니냐?

### BL23 [등·허리] 🟠 중대
- 원문: 直刺 0.3～1寸 (모델 상한 20.2 mm)
- 기대 층: BL22와 같음 (L2)
- 문제: 가장긴근과 허리네모근 겹침(36~38 mm), 큰허리근 대신 가로돌기사이근 → L3
- 현재 경로: latissimus dorsi 8.3 → serratus posterior inferior 16.7 → serratus posterior inferior 18.4 → iliocostalis lumborum 20.2 → longissimus thoracis 30.5 → quadratus lumborum 36.3 → quadratus lumborum 55.3 → lumbar rotator 64.3 → lateral lumbar intertransversarius 64.7 → medial lumbar intertransversarius 65.2 → Third lumbar vertebra 66.2
- 근접 미표시: Obturator nerve 2.8mm옆@68.1; Femoral nerve 4.6mm옆@68.3
- 근거: 요추 MRI 2020 https://doi.org/10.1016/j.imr.2020.100679: L2 가로돌기 49 mm (모델 66 mm, 17 mm 깊음)
- 제안: 허리네모근·척추세움근 정합

판정: 아마 허리쪽 (정중선에서 1.5촌 이내)는 모두 기립근군 타겟을 하는거로 알고 있다. 근데 L2~L5쪽 부분은 신장 조심하라고 따로 넣어놓는 것을 제안한다. 

### BL24 [등·허리] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: (L3)
- 문제: 가로돌기에 닿지 않고 72 mm에서 큰허리근, 98 mm 요관
- 현재 경로: latissimus dorsi 12.6 → iliocostalis lumborum 19.1 → quadratus lumborum 29.2 → quadratus lumborum 51.9 → lateral lumbar intertransversarius 59.8 → psoas major 72
- 빈 구간: 0→13mm(latissimus dorsi 앞); 62→72mm(psoas major 앞)
- 근접 미표시: Lumbar artery 0.9mm옆@67.6
- 근거: 요추 MRI 2020 https://doi.org/10.1016/j.imr.2020.100679: L3 가로돌기 53 mm
- 제안: 정합

판정: 정합하는데, 여기도 신장 조심 넣어놓는 것을 제안. (학술적으로 맞는지 먼저 확인바람. 차피 안닿나 뼈때문에)

### BL51 [등·허리] 🟠 중대
- 원문: 直刺 0.3～0.6寸 (모델 상한 12.1 mm)
- 기대 층: 넓은등근 → 아래뒤톱니근 → 엉덩갈비근 → 허리네모근 → (콩팥)
- 문제: 아래뒤톱니근 누락, 허리네모근~큰허리근 42 mm 공백, 콩팥 4.4 mm 근접 미표시
- 현재 경로: latissimus dorsi 5.2 → iliocostalis lumborum 16.3 → quadratus lumborum 21.8 → psoas major 71
- 빈 구간: 29→71mm(psoas major 앞)
- 근거: MRI 콩팥부위 연구(수치 미확보)
- 제안: 공백·근접 표시

판정: 신장부위가 L2~L5 부분으로 아는데, 이거 맞는지 실제 확인하고 넣어놔라. 

### BL52 [등·허리] 🟠 중대
- 원문: 直刺 0.5～1寸 (禁深刺) (모델 상한 20.2 mm)
- 기대 층: BL51과 같음 (L2)
- 문제: 콩팥 89.8 mm로 깊음, 허리네모근~큰허리근 공백
- 현재 경로: latissimus dorsi 2.5 → iliocostalis lumborum 12.3 → quadratus lumborum 19.2 → psoas major 65.1 → kidney 89.8
- 빈 구간: 34→65mm(psoas major 앞)
- 근접 미표시: Lumbar artery 3.8mm옆@45.9; Femoral nerve 1.3mm옆@65.8; Genitofemoral nerve 1.1mm옆@73.8
- 근거: 원문: 禁深刺
- 제안: 콩팥 깊이 확인

판정: 동일하게 확인 후 넣어라. 

### GV4 [등·허리] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 가시끝인대 → 가시사이인대 → 황색인대 → 경막
- 문제: 30 mm에서 가시돌기 충돌 → 위치가 가시돌기 위
- 현재 경로: latissimus dorsi 13.2 → Supraspinous ligament 22.8 → Second lumbar vertebra 30.2
- 빈 구간: 0→13mm(latissimus dorsi 앞)
- 근거: 해부
- 제안: 위치

판정: 가시돌기 바로 위에 놓는게 아니라, 가시돌기 아래부분 오목한 공간에 넣는거다. 이를 확인해라. 

### GV5 [등·허리] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: GV4와 같음
- 문제: 27 mm에서 가시돌기 충돌
- 현재 경로: Supraspinous ligament 22.3 → First lumbar vertebra 27.4
- 빈 구간: 0→22mm(Supraspinous ligament 앞)
- 근거: 해부
- 제안: 위치

판정: 극돌기가 아니라 극돌기 하단 공간에 넣기 때문에 위치 수정을 이를 참고해라. 

### GV9 [등·허리] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 7 → latissimus dorsi 12.7 → Supraspinous ligament 16.2 → spinalis thoracis 18.5 → Eighth thoracic vertebra 31.9
- 방향 보정 시 (34° 편차): Ascending part trapezius 7.2 → multifidus 10.6 → latissimus dorsi 12.9 → spinalis thoracis 18.6 → semispinalis thoracis 26.2 → thoracic rotator 35.2 → Eighth thoracic vertebra 39.6
- 빈 구간: 21→32mm(Eighth thoracic vertebra 앞)

판정: 보정해라. 

### GV12 [등·허리] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 8.6 → Ascending part trapezius 10.5 → rhomboid major 13.6 → splenius capitis 15 → Supraspinous ligament 16.3 → splenius cervicis 17.4 → semispinalis thoracis 29.3 → Fourth thoracic vertebra 42.6
- 방향 보정 시 (36° 편차): Ascending part trapezius 5.3 → rhomboid major 15.2 → multifidus 19.6 → splenius cervicis 23 → multifidus 23.2 → semispinalis thoracis 33.7 → semispinalis cervicis 39.7 → Fourth thoracic vertebra 48.6
- 빈 구간: 19→29mm(semispinalis thoracis 앞)

판정:

### GV13 [등·허리] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Transverse part trapezius 13.3 → rhomboid major 18.8 → splenius capitis 21.4 → splenius capitis 22.8 → serratus posterior superior 24 → Supraspinous ligament 26.5 → Second thoracic vertebra 26.9
- 방향 보정 시 (27° 편차): Transverse part trapezius 13.2 → Transverse part trapezius 15.6 → rhomboid major 19.4 → splenius capitis 19.7 → serratus posterior superior 21.5 → Supraspinous ligament 25.2 → Second thoracic vertebra 42.2
- 빈 구간: 0→13mm(Transverse part trapezius 앞)

판정: 보정

### BL27 [엉치·볼기] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 20.2 mm)
- 현재 경로: iliocostalis lumborum 23.5 → gluteus maximus 28.1 → Posterior sacro-iliac ligamentr 34.6 → quadratus lumborum 36.1 → Sacrum 37.3
- 방향 보정 시 (58° 편차): gluteus maximus 39.7
- 빈 구간: 0→24mm(iliocostalis lumborum 앞)

판정: 편차 수정해라. 

### BL28 [엉치·볼기] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 20.2 mm)
- 기대 층: 엉치뼈 뒷면 (둘째 엉치뼈구멍 높이)
- 문제: 큰볼기근 → 궁둥구멍근 → 궁둥신경(74.5 mm) → 위치가 엉치뼈 가쪽
- 현재 경로: gluteus maximus 25.4 → piriformis 64.3 → Sciatic nerve 74.5 → hip bone 85.1
- 방향 보정 시 (50° 편차): gluteus maximus 49.5
- 빈 구간: 0→25mm(gluteus maximus 앞); 47→64mm(piriformis 앞)
- 근거: 검수 메모: 높이 재조정
- 제안: 위치 수정 선행

판정: 편차가 좀 많이 크다. 잘 수정해라. 엉치뼈구멍 반대편을 향하고 있다. 나머지 엉치뼈구멍 관련 혈이 다 그래보인다. 이쪽은 다 재검수해라. 

### BL30 [엉치·볼기] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 20.2 mm)
- 기대 층: 엉치뼈 가쪽 (넷째 엉치뼈구멍 높이)
- 문제: 궁둥신경 교차 67.7 mm
- 현재 경로: gluteus maximus 25.4 → Sciatic nerve 67.7 → piriformis 71.1 → hip bone 80.3
- 빈 구간: 0→25mm(gluteus maximus 앞); 50→68mm(Sciatic nerve 앞)
- 근접 미표시: inferior gluteal vein 1.8mm옆@56.7
- 근거: 같음
- 제안: 같음

판정: 방향 바꾸고, 궁둥신경 관련 표시는 하는게 좋아보인다. 전체 엉치뼈 관련 혈자리. 

### BL31 [엉치·볼기] 🟠 중대
- 원문: 直刺 0.5～1.2寸 (刺入仙骨後孔內) (모델 상한 24.3 mm)
- 기대 층: 뭇갈래근 → 첫째 뒤엉치뼈구멍
- 문제: 뭇갈래근 누락, 구멍이 아닌 엉치뼈 면
- 현재 경로: iliocostalis lumborum 12.6 → Posterior sacro-iliac ligamentr 31.7 → gluteus maximus 33.3 → Sacrum 33.6
- 빈 구간: 0→13mm(iliocostalis lumborum 앞)
- 근거: 검수 메모: 구멍 직접 타겟
- 제안: 위치 수정 선행

판정: 동일하다. 방향이 엉치뼈구멍 정반대로 향하고 있다. 

### BL32 [엉치·볼기] 🟠 중대
- 원문: 直刺 0.5～1寸 (刺入仙骨後孔內) (모델 상한 20.2 mm)
- 현재 경로: iliocostalis lumborum 14.9 → Posterior sacro-iliac ligamentr 33.6 → Posterior sacro-iliac ligamentr 34.4 → gluteus maximus 35 → Sacrum 35.2
- 방향 보정 시 (29° 편차): iliocostalis lumborum 11.1 → iliocostalis lumborum 15.4 → longissimus thoracis 21.5 → Posterior sacro-iliac ligamentr 25.8 → Posterior sacro-iliac ligamentr 27.8 → Sacrum 30.4
- 빈 구간: 0→15mm(iliocostalis lumborum 앞)

판정: 동일.

### BL33 [엉치·볼기] 🟠 중대
- 원문: 直刺 0.5～1寸 (刺入仙骨後孔內) (모델 상한 20.2 mm)
- 기대 층: 뭇갈래근 → 셋째 뒤엉치뼈구멍
- 문제: 큰볼기근 → 궁둥구멍근 → 궁둥신경 → 위치가 엉치뼈 가쪽
- 현재 경로: gluteus maximus 28 → piriformis 69.1 → Sciatic nerve 69.5 → hip bone 84.9
- 빈 구간: 0→28mm(gluteus maximus 앞); 50→69mm(piriformis 앞)
- 근거: 같음
- 제안: 같음

판정: 동일. 

### BL34 [엉치·볼기] 🟠 중대
- 원문: 直刺 0.5～1寸 (刺入仙骨後孔內) (모델 상한 20.2 mm)
- 기대 층: 넷째 뒤엉치뼈구멍
- 문제: 방향 47°, 궁둥신경 1.7 mm @77.7
- 현재 경로: gluteus maximus 27.9 → multifidus 38.5 → inferior gluteal vein 57.8 → piriformis 65.6 → Posterior femoral cutaneous nerve 66.3 → hip bone 92.5
- 방향 보정 시 (47° 편차): gluteus maximus 45.8
- 빈 구간: 0→28mm(gluteus maximus 앞); 74→93mm(hip bone 앞)
- 근접 미표시: internal pudendal vein 3.4mm옆@73.9; Sciatic nerve 1.7mm옆@77.7
- 근거: 같음
- 제안: 같음

판정: 동일. 

### BL35 [엉치·볼기] 🟠 중대
- 원문: 直刺 0.3～0.8寸 (모델 상한 16.2 mm)
- 기대 층: 꼬리뼈 끝 옆 → 큰볼기근 → 궁둥항문오목
- 문제: 70 mm에서 궁둥신경 → 방향이 가쪽
- 현재 경로: gluteus maximus 16.3 → Sciatic nerve 70 → piriformis 76.7 → hip bone 97.3
- 방향 보정 시 (21° 편차): gluteus maximus 18.1
- 빈 구간: 0→16mm(gluteus maximus 앞); 44→70mm(Sciatic nerve 앞)
- 근거: 해부
- 제안: 방향

판정: 꼬리뼈끝 부분이니까, 이를 고려해서 수정해라. 

### BL54 [엉치·볼기] 🟠 중대
- 원문: 直刺 0.5～1.5寸 (모델 상한 30.3 mm)
- 기대 층: 큰볼기근 → 궁둥구멍근 아래 → 궁둥신경
- 문제: 궁둥신경 근접 없음 (임상적으로 궁둥신경 자극 혈)
- 현재 경로: gluteus maximus 18.6 → piriformis 67
- 빈 구간: 0→19mm(gluteus maximus 앞); 46→67mm(piriformis 앞)
- 근거: 해부
- 제안: 위치 확인

판정: 높이는 맞는 듯 하다. 궁둥신경정도만 추가해라. 

### GB29 [엉치·볼기] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 22.3 mm)
- 기대 층: 넙다리근막긴장근 → 중간볼기근 → 작은볼기근 → 엉덩뼈/관절주머니
- 문제: 중간·작은볼기근 누락, 넙다리곧은근 쪽으로 감. 시드가 피부에서 28 mm
- 현재 경로: iliotibial tract 2.9 → tensor fasciae latae 6.2 → rectus femoris 40.3 → hip bone 62.6
- 방향 보정 시 (15° 편차): iliotibial tract 2.7 → femur 60.3
- 빈 구간: 12→40mm(rectus femoris 앞)
- 근거: 해부
- 제안: 위치·방향

판정: 위치는 맞는 듯 하다. 누락된 구조물은 전부 자침 시뮬레이션에 넣어라. 

### GB30 [엉치·볼기] 🟠 중대
- 원문: 直刺 1～2寸 또는 2～3寸 (모델 상한 44.5 mm)
- 기대 층: 큰볼기근 → 위·아래쌍둥이근/속폐쇄근 → (안쪽에 궁둥신경)
- 문제: 궁둥신경 12 mm 밖, 큰볼기근 → 넙다리네모근
- 현재 경로: gluteus maximus 22.5 → quadratus femoris 51.2
- 빈 구간: 0→23mm(gluteus maximus 앞); 41→51mm(quadratus femoris 앞)
- 근거: KIOM·원광대 고위험 44혈(영상만)
- 제안: 궁둥신경 거리 표시

판정: 위치 수정이 필요하다. 대전자(큰돌기융기)~엉치뼈틈새 1:2 나누는 부분인데, 현재 바깥쪽 부분이다. 그리고, 환도혈을 끝까지 자침 시, 찌릿한 궁둥신경을 자극하는게 정상이다. 궁둥신경을 자침 시뮬레이션에 반드시 포함할 것. 일단 위치 수정이 1순위. 

### CV3 [배·샅] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: Linea alba 33.5 → Middle part of ileum 38.2
- 빈 구간: 0→34mm(Linea alba 앞)
- 이전 txt 판정: 반려: 배꼽 기준을 잡기 어렵다면, 앞정중선 위에서 배곧은집근막~곡골의 중점으로 잡아도 된다.

판정: 빈 구간 알아서 수정. 

### CV4 [배·샅] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: Linea alba 30 → Middle part of ileum 48.8
- 방향 보정 시 (25° 편차): external oblique 27 → internal oblique 27.5 → rectus abdominis 29.2 → internal oblique 29.2 → transversus abdominis 32 → Distal part of ileum 47.3
- 빈 구간: 0→30mm(Linea alba 앞); 31→49mm(Middle part of ileum 앞)
- 근접 미표시: Middle part of ileum 2.1mm옆@32.6; Distal part of ileum 2.8mm옆@47.6
- 이전 txt 판정: 반려: 동일하게, 앞정중선~배곧은집근막이 만나는 지점으로 해도 된다.

판정: 방향 수정 더 할거 있나? 일단 관련된 해부학적 구조물은 넣어봐라.

### CV10 [배·샅] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: Linea alba 15.4 → Transverse colon 20
- 빈 구간: 0→15mm(Linea alba 앞)

판정:

### GB25 [배·샅] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (不宜深刺) (모델 상한 10.1 mm)
- 기대 층: 12번 갈비뼈 끝 아래: 배바깥·속빗근 → 배가로근 → (콩팥)
- 문제: 콩팥 39 mm로 얕음, 배속빗근 누락, 시드가 피부에서 35 mm
- 현재 경로: external oblique 15.4 → transversus abdominis 26.1 → Diaphragm 30.4 → kidney 39.3
- 빈 구간: 0→15mm(external oblique 앞)
- 근접 미표시: Intercostal nerves 4.8mm옆@20.1
- 근거: 원문: 不宜深刺
- 제안: 위치 재확인

판정: 위치 재확인이 필요하다. 12번째 갈비뼈 맨 끝 지점에서 수직으로 올라와 피부에 닿는 지점으로 변경해라. 

### GB26 [배·샅] 🟠 중대
- 원문: 直刺 0.5～0.8寸 (모델 상한 17.8 mm)
- 현재 경로: external oblique 10.6 → internal oblique 24.5 → Ascending colon 25.3
- 방향 보정 시 (35° 편차): external oblique 15.3 → Ascending colon 26.9
- 빈 구간: 0→11mm(external oblique 앞)
- 근접 미표시: iliolumbar vein 1.5mm옆@15.4; Ilio-inguinal nerve 3.8mm옆@20.6

판정: 동맥과 신경이 여기를 정확히 지나는건 아닐텐데, 그냥 인접으로 포함된다고 넣는건 어떰? (자침 시뮬레이터에 직접적으로 넣을지는 잘 모르겠다.)

### GB28 [배·샅] 🟠 중대
- 원문: 直刺 0.5～0.8寸 (모델 상한 23.8 mm)
- 기대 층: 위앞엉덩뼈가시 앞아래: 샅고랑인대·빗근층 → 엉덩근 (가쪽넙다리피부신경)
- 문제: 넙다리빗근·넙다리곧은근 쪽 → 넓적다리로 내려간 위치
- 현재 경로: sartorius 31.4 → rectus femoris 49.7 → iliacus 55.2 → femur 72.5
- 빈 구간: 0→31mm(sartorius 앞); 35→50mm(rectus femoris 앞)
- 근거: WHO
- 제안: 위치

판정: 위치가 매우 하단이다. inguinal ligament위부분에 존재해야 하고, 위쪽으로 평행하게 올리기만 하면 될 것 같다. 그리고 자침 가이드에 inguinal ligament(한국어로 적어라)도 반드시 같이 넣어라. 

### KI11 [배·샅] 🟠 중대
- 원문: 直刺 0.5～0.8寸 (모델 상한 23.8 mm)
- 기대 층: (궁상선 아래) 복직근집 앞층 → 복직근/배세모근 → 가로근막 → (방광)
- 문제: 배가로근 → 배속빗근 → 배바깥빗근 → 복직근 완전 역순
- 현재 경로: transversus abdominis 24.7 → internal oblique 26.4 → external oblique 32.5 → rectus abdominis 35.1 → Distal part of ileum 40.6
- 빈 구간: 0→25mm(transversus abdominis 앞)
- 근거: 해부
- 제안: 복벽 정합

판정: 복벽 정합하고, 근데 이쪽은 심자(당연히 자침 시뮬레이터 상한선 밑이겠지만)하면 방광쪽인거 맞지 않나? 근데 자침 가이드에 '제'라고 나온건 뭐냐 뭔가 잘린거같은데? 

### KI12 [배·샅] 🟠 중대
- 원문: 直刺 0.5～0.8寸 (모델 상한 23.8 mm)
- 기대 층: (0.5寸 가쪽) 복직근집 앞층 → 복직근 → 가로근막 → 복막
- 문제: 면 법선 85° 오류, 복직근 없이 백색선
- 현재 경로: external oblique 25.5 → Linea alba 31.5 → Middle part of ileum 36.6
- 빈 구간: 0→26mm(external oblique 앞)
- 근거: 해부
- 제안: 위치·방향

판정: 방향 조정해라. 

### KI13 [배·샅] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 기대 층: KI12와 같음
- 문제: 복직근 없이 백색선 → 소장. 위치가 정중선에 너무 가까움
- 현재 경로: Linea alba 29.3 → Middle part of ileum 33.7
- 빈 구간: 0→29mm(Linea alba 앞)
- 근거: 해부
- 제안: 위치

판정: 제안대로 수정. 

### KI18 [배·샅] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 13.1 → internal oblique 13.4 → rectus abdominis 15.4 → internal oblique 23.1 → transversus abdominis 25.5 → Transverse mesocolon 39.1
- 방향 보정 시 (40° 편차): Linea alba 20.6 → transversus abdominis 27.8 → Transverse colon 31.4
- 빈 구간: 0→13mm(external oblique 앞); 26→39mm(Transverse mesocolon 앞)
- 근접 미표시: superior epigastric artery 1.1mm옆@20.7; Middle colic artery 1.8mm옆@34.9; Middle colic vein 1.5mm옆@36.7; gastro-epiploic artery 4.5mm옆@38.6; Stomach 4.7mm옆@42

판정: 복벽 층 순서 오류는 해부학 기준으로 해라. 다른 것도 마찬가지겠지만, 모델링 순서대로 하지 않는다. 근데 자침 방향은 뭐 바꿀게 있냐? 

### LR12 [배·샅] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 14.9 mm)
- 기대 층: 두덩결절 옆 → 넙다리정맥 안쪽
- 문제: 면 법선 69° 오류, 복벽 층 순서 오류
- 현재 경로: external oblique 24.2 → transversus abdominis 24.3 → internal oblique 25.2 → inguinal ligament 33.9 → Distal part of ileum 41.4
- 빈 구간: 0→24mm(external oblique 앞)
- 근접 미표시: superficial epigastric vein 3.4mm옆@19.6; superficial epigastric artery 4mm옆@20.2; Distal part of ileum 0.8mm옆@37.2; femoral artery 4.2mm옆@42.9; deep femoral vein 1.9mm옆@45.5
- 근거: 해부
- 제안: 방향·정합

판정: 위치 자체는 inguinal ligament 살짝 아래인 현재가 맞는거 같은데, 관련되서 배깥엉덩정맥, 동맥, 넙다리신경 안쪽으로 들어가는 것은 반드시 강조해야 할 것 같다. (자침하면 안되는 3개 구조물 표시, 위험구조물.) 관련 구조물 빠진것들은 전부 넣어라. 

### ST23 [배·샅] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: internal oblique 14.9 → external oblique 16.6 → rectus abdominis 19.4 → internal oblique 21.3 → transversus abdominis 31.4 → Transverse colon 34.4
- 방향 보정 시 (41° 편차): external oblique 20.4 → internal oblique 21.3 → rectus abdominis 24.4 → internal oblique 35.3 → transversus abdominis 35.7 → internal oblique 41.1 → Transverse colon 43.6
- 빈 구간: 0→15mm(internal oblique 앞)

판정: 편차 수정해라. 빠진 자침 시뮬레이션 구조들 전부 넣어라. 

### ST24 [배·샅] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: internal oblique 16.4 → external oblique 17 → rectus abdominis 19.4 → internal oblique 31.1 → transversus abdominis 31.2 → Distal part of jejunum 35
- 방향 보정 시 (25° 편차): internal oblique 20.1 → external oblique 20.9 → rectus abdominis 21.8 → transversus abdominis 39.4 → internal oblique 39.5 → Distal part of jejunum 44.8
- 빈 구간: 0→16mm(internal oblique 앞)

판정: 편차 수정하고, 빠진 자침 시뮬레이션 구조물 지나는거 전부 표시해라. 

### ST29 [배·샅] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: superficial epigastric vein 5.6 → internal oblique 21.7 → external oblique 24 → rectus abdominis 26.3 → transversus abdominis 30.3 → Middle part of ileum 35.3
- 방향 보정 시 (64° 편차): external oblique 34.7 → internal oblique 35.1 → rectus abdominis 37.1 → internal oblique 62.5 → Proximal part of ileum 77.7
- 빈 구간: 9→22mm(internal oblique 앞)
- 근접 미표시: Middle part of ileum 1.4mm옆@35

판정: 방향  보정해라. 

### LI15 [어깨·견갑] 🟠 중대
- 원문: 直刺 0.5～1.2寸 (모델 상한 24 mm)
- 기대 층: (팔 벌림) 어깨세모근 → 어깨세모근밑주머니 → 가시위근 힘줄 → 관절
- 문제: 삼각근 두께 4.9 mm, 8.6 mm에서 위팔뼈. 팔 내린 모델 자세 영향
- 현재 경로: Acromial part deltoid 0 → supraspinatus 4.9 → humerus 8.6
- 방향 보정 시 (16° 편차): Acromial part deltoid 0 → supraspinatus 4.8 → humerus 9.2
- 근거: 해부
- 제안: 자세 불일치 표기

판정: 

### SI9 [어깨·견갑] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 20 mm)
- 기대 층: 어깨세모근 뒤부분 → 작은원근/큰원근 → 위팔세갈래근 긴갈래 (사각공간: 겨드랑신경·뒤위팔휘돌이동맥)
- 문제: 삼각근 뒤 34→72 mm 공백. 필수 근육 3개 누락
- 현재 경로: Spinal part deltoid 24.4 → humerus 72.7
- 방향 보정 시 (25° 편차): Long head triceps brachii 54.1
- 빈 구간: 0→24mm(Spinal part deltoid 앞); 34→73mm(humerus 앞)
- 근거: 해부
- 제안: 검수 메모('좌표 대폭 수정') 선행, 공백 원인 확인

판정: 위치는 얼추 맞는데, 각도가 좀 상방으로 향해 있어서 이를 수정하면 좋을 듯 하다. 그리고 아마 삼각근 바로 아래긴 해도 후면삼각을 찌르지 않을까 싶다. 

### SI10 [어깨·견갑] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 20.2 mm)
- 기대 층: 어깨세모근 뒤부분 → 가시아래근 → 어깨관절오목 목
- 문제: 방향 39°로 아래로 가서 작은원근·세갈래근을 지나 84 mm에서 노신경
- 현재 경로: Spinal part deltoid 13.2 → infraspinatus muscle 31.6 → teres minor 42.7 → Long head triceps brachii 61.3
- 방향 보정 시 (21° 편차): Spinal part deltoid 14.3 → infraspinatus muscle 31.5 → scapula 62.7
- 빈 구간: 0→13mm(Spinal part deltoid 앞)
- 근접 미표시: circumflex scapular vein 3.7mm옆@66.9
- 근거: 해부
- 제안: 위치 수정 선행, 방향 보정

판정: 방향 보정해라. 그리고 위치 수정도 하고.. 

### SI11 [어깨·견갑] 🟠 중대
- 원문: 直刺 0.5寸 (모델 상한 10.1 mm)
- 기대 층: (피하) → 가시아래근 → 가시아래오목(뼈)
- 문제: 방향 53~65° 편차로 척추 쪽 진행, 가시아래근·견갑골 누락. 시드가 피부에서 23 mm 떨어짐
- 현재 경로: Ascending part trapezius 15.6 → rhomboid major 53.6 → dorsal scapular artery 53.6 → longissimus thoracis 64.6 → longissimus cervicis 79.4 → Fifth thoracic vertebra 81.8
- 방향 보정 시 (53° 편차): infraspinatus muscle 18.6 → scapula 35.7
- 빈 구간: 0→16mm(Ascending part trapezius 앞)
- 근거: 해부
- 제안: 검수 메모('좌표 전면 수정') 선행
- 이전 txt 판정: 반려: 자침 시뮬레이터가 직자가 아니라 사자로 나온 듯하다. 그리고 자침 가이드의 견갑극 표시점은 견갑극 중점으로 잡는게 나을듯.

판정: 각도 자체가 현재 사자 수준인거 동일하다. 방향 수정을 반드시 해라. 

### HT3 [위팔·팔꿈치] 🟠 중대
- 원문: 直刺 0.3～0.8寸 (모델 상한 16 mm)
- 기대 층: 원엎침근 → 위팔근 (가쪽에 정중신경·위팔동맥, 뒤에 자신경)
- 문제: 원엎침근 누락, 정중신경·위팔동맥 8 mm 밖
- 현재 경로: brachialis 18.1 → humerus 25.7
- 빈 구간: 0→18mm(brachialis 앞)
- 근접 미표시: basilic vein 3.3mm옆@16.1
- 근거: 해부
- 제안: 위치 확인

판정: 누락 근육 넣어라. 위치는 팔꿈치 주름 위~안쪽융기 사이로 하면 될듯. 

### LI11 [위팔·팔꿈치] 🟠 중대
- 원문: 直刺 0.5～1.5寸 (모델 상한 30 mm)
- 기대 층: 긴노쪽손목폄근/위팔노근 → 위팔근 (사이 깊이에 노신경)
- 문제: 긴노쪽손목폄근 누락, 32.7 mm에서 위팔뼈. 노신경 4.8 mm 근접 미표시
- 현재 경로: brachioradialis 11.5 → humerus 32.7
- 빈 구간: 0→12mm(brachioradialis 앞)
- 근접 미표시: Radial nerve 4.8mm옆@14
- 근거: 해부
- 제안: 근접 표시

판정: 누락한 근육 전부 넣어라. 근접은 기다려라. 

### LU5 [위팔·팔꿈치] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 10 mm)
- 기대 층: 위팔노근 → 위팔근 (사이에 노신경)
- 문제: 19 mm 공백 뒤 위팔근. 위팔노근·노신경 누락
- 현재 경로: brachialis 19.4 → humerus 39.6
- 빈 구간: 0→19mm(brachialis 앞)
- 근접 미표시: cephalic vein 4.8mm옆@10.4
- 근거: 해부
- 제안: 위치 확인(검수 메모: 주름 바로 위)

판정: 나락된 구조물을 넣어놔라. 위치도 다시 확인하고.. 

### LI8 [아래팔] 🟠 중대
- 원문: 直刺 0.5～0.8寸 (모델 상한 17.9 mm)
- 현재 경로: brachioradialis 6.2 → supinator 28.3 → radius 31.9
- 방향 보정 시 (61° 편차): brachioradialis 8.1
- 빈 구간: 18→28mm(supinator 앞)

판정:

### LI10 [아래팔] 🟠 중대
- 원문: 直刺 0.5～1.2寸 (모델 상한 26.9 mm)
- 기대 층: 긴·짧은노쪽손목폄근 → 손뒤침근 (노신경 깊은가지)
- 문제: 손목폄근·손뒤침근 누락, 위팔노근 → 25 mm에서 노뼈
- 현재 경로: brachioradialis 3.4 → radius 24.9
- 근접 미표시: radial recurrent artery 4.2mm옆@22
- 근거: 해부
- 제안: —

판정:

### PC4 [아래팔] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 22.4 mm)
- 기대 층: 긴손바닥근·노쪽손목굽힘근 힘줄 사이 → 얕은손가락굽힘근 → 정중신경 → 깊은손가락굽힘근
- 문제: 방향 53°. 정중신경 2.6 mm 근접 미표시
- 현재 경로: flexor carpi radialis 1.5 → flexor digitorum superficialis 6.1 → flexor digitorum profundus 13.3 → ulna 29.9
- 방향 보정 시 (53° 편차): palmaris longus 3.3 → Humeral head flexor carpi ulnaris 22.5
- 근접 미표시: ulnar vein 4.5mm옆@14; Median nerve 2.6mm옆@17.2
- 근거: 해부
- 제안: 방향 보정, 근접 표시

판정: 방향 보정해라. 

### SI7 [아래팔] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 11.2 mm)
- 현재 경로: Ulnar head flexor carpi ulnaris 9.5 → ulna 21
- 방향 보정 시 (33° 편차): extensor carpi ulnaris 19 → extensor carpi ulnaris 21.9 → abductor pollicis longus 29.5 → extensor carpi radialis brevis 47.4

판정: 방향 보정해라. 기준은 양소해(SI 8)~양곡혈 사이 거리 5: 7로 나누는 거리다. 

### TE7 [아래팔] 🟠 중대
- 원문: 直刺 0.5～0.9寸 (모델 상한 20.2 mm)
- 현재 경로: extensor digiti minimi 12.6 → extensor pollicis longus 18.6 → extensor pollicis brevis 28.7 → Interosseous membrane forearm 29.5 → pronator quadratus 31.1 → anterior interosseous artery 33.4 → flexor digitorum profundus 35.7 → flexor digitorum superficialis 43.3 → flexor carpi radialis 50.8
- 방향 보정 시 (26° 편차): extensor carpi ulnaris 14.5 → extensor carpi ulnaris 16.8 → extensor indicis 23.5 → ulna 24
- 빈 구간: 0→13mm(extensor digiti minimi 앞)
- 근접 미표시: Anterior interosseous nerve of forearm 4.4mm옆@27.7; Median nerve 5mm옆@39.9; median antebrachial vein 3.5mm옆@54.5

판정: 현재도 방향 괜찮은데 왜 수정한다는건지 모르겠다. 

### TE9 [아래팔] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 22.4 mm)
- 현재 경로: extensor carpi ulnaris 20 → abductor pollicis longus 31 → Interosseous membrane forearm 39.8 → flexor digitorum profundus 42.5 → flexor digitorum superficialis 54.1
- 방향 보정 시 (28° 편차): extensor digitorum 16.7 → extensor carpi radialis brevis 26.3 → Humeral head pronator teres 47.1 → radial artery 51.5 → brachioradialis 54.6 → Lateral antebrachial cutaneous nerve 68.7
- 빈 구간: 0→20mm(extensor carpi ulnaris 앞)
- 근접 미표시: Posterior interosseous nerve of forearm 1.7mm옆@35.9; Anterior interosseous nerve of forearm 4.2mm옆@38.3; anterior interosseous artery 0.2mm옆@44.3

판정: 틀어진 각도긴 한거같은데, 위치 자체는 괜찮다. 

### LR10 [넓적다리] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 기대 층: 긴모음근 → 짧은모음근
- 문제: 긴모음근 누락, 두덩근 34.9, 넙다리신경 3.8 mm 근접 → 위치가 가쪽
- 현재 경로: pectineus 34.9
- 빈 구간: 0→35mm(pectineus 앞)
- 근접 미표시: Femoral nerve 3.8mm옆@35.8; deep femoral vein 3.1mm옆@37.2
- 근거: 해부
- 제안: 위치

판정: 긴모음근 누락, 근접 표시 예정. 

### BL38 [무릎·오금] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 22.3 mm)
- 기대 층: BL39와 같음 (1寸 위)
- 문제: 오금동맥 교차 @39, 온종아리신경 미표시
- 현재 경로: Lateral head gastrocnemius 27.1 → plantaris 30.7 → popliteal artery 39.2 → femur 59
- 빈 구간: 0→27mm(Lateral head gastrocnemius 앞); 47→59mm(femur 앞)
- 근접 미표시: Tibial nerve 1.9mm옆@31.3; small saphenous vein 1.4mm옆@32.7; middle genicular artery 0.4mm옆@42.3
- 근거: 해부
- 제안: 같음

판정:

### GB33 [무릎·오금] 🟠 중대
- 원문: 直刺 0.3～0.5寸 (모델 상한 11.9 mm)
- 현재 경로: Long head biceps femoris 13.2 → Short head biceps femoris 19.8 → fibula 21.4
- 방향 보정 시 (27° 편차): Long head biceps femoris 14.3 → fibula 25.7
- 빈 구간: 0→13mm(Long head biceps femoris 앞)

판정:

### KI10 [무릎·오금] 🟠 중대
- 원문: 0.5～1寸 直刺 (모델 상한 22.3 mm)
- 기대 층: 반힘줄근·반막근 힘줄 사이 → 장딴지근 안쪽갈래
- 문제: 방향 58°, 힘줄 구조 없음
- 현재 경로: femur 54.7
- 방향 보정 시 (58° 편차): great saphenous vein 5.4 → tibia 38.8
- 빈 구간: 0→55mm(femur 앞)
- 근접 미표시: great saphenous vein 4.2mm옆@3.1; middle genicular artery 1.1mm옆@25.6; popliteal artery 1.8mm옆@44; popliteal vein 3.6mm옆@51.3
- 근거: 해부
- 제안: 방향

판정: 방향을 반건양근건에 가깝게 틀어야 할 듯 하다. 위치도 마찬가지로.. 

### SP9 [무릎·오금] 🟠 중대
- 원문: 直刺 0.5～1寸 (모델 상한 23.8 mm)
- 기대 층: (정강뼈 뒤모서리 따라, 원문 GB34 투자) 장딴지근 안쪽갈래/오금근
- 문제: 9 mm에서 정강뼈 충돌
- 현재 경로: semimembranosus 4.4 → tibia 9.1
- 방향 보정 시 (15° 편차): semimembranosus 4.2 → tibia 9
- 근거: 검수 메모: 뼈에 가깝게 앞으로
- 제안: 위치·방향

판정: 이건 자침 가이드 켤 때, 다른 무릎 아래 혈자리처럼 반대쪽 다리 순간적으로 가려야 할 듯 하다. 안보인다. 

### BL57 [종아리] 🟠 중대
- 원문: 0.5～1.5寸 直刺 (모델 상한 35.7 mm)
- 기대 층: 장딴지근 → 가자미근 → (정강신경·뒤정강혈관) → 뒤정강근
- 문제: 정강신경 근접 없음
- 현재 경로: Lateral head gastrocnemius 12.7 → soleus 20 → fibular vein 32.9 → tibialis posterior 55.9 → tibia 64.5
- 빈 구간: 0→13mm(Lateral head gastrocnemius 앞); 41→56mm(tibialis posterior 앞)
- 근접 미표시: Sural nerve 2mm옆@22.2
- 근거: 해부
- 제안: 확인

판정: 근접 대기. 

### KI7 [종아리] 🟠 중대
- 원문: 0.3～0.5寸 直刺 (모델 상한 11.9 mm)
- 현재 경로: posterior tibial vein 0 → posterior tibial artery 7.6 → soleus 9.8 → flexor hallucis longus 29.3 → fibularis brevis 42.9 → fibularis longus 54.4
- 방향 보정 시 (29° 편차): posterior tibial vein 0 → plantaris 4.1 → calcaneal tendon 8.7 → soleus 10.4 → calcaneal tendon 21.1 → calcaneal tendon 21.5
- 빈 구간: 10→29mm(flexor hallucis longus 앞)
- 근접 미표시: fibular vein 2.4mm옆@20.7; fibular artery 1.6mm옆@29

판정: 근접 대기. 나머지는 다 표시해라. 

### SP6 [종아리] 🟠 중대
- 원문: 1～1.5寸 直刺 (모델 상한 35.7 mm)
- 기대 층: 긴발가락굽힘근 → 뒤정강근 → 긴엄지굽힘근 (뒤에 뒤정강동정맥·정강신경)
- 문제: 뒤정강근 누락, 정강신경 3 mm 근접 미표시
- 현재 경로: flexor digitorum longus 5.9 → flexor hallucis longus 27.2 → fibularis brevis 50.4
- 근접 미표시: Tibial nerve 3mm옆@31.9
- 근거: 해부
- 제안: 근접 표시

판정:

### ST36 [종아리] 🟠 중대
- 원문: 0.5～1.5寸 直刺 (모델 상한 35.7 mm)
- 기대 층: 앞정강근 → 뼈사이막(앞정강동맥·깊은종아리신경) → 뒤정강근
- 문제: 층 순서 정상. 앞정강동맥 4.7 mm 근접 미표시, 깊이 40 mm
- 현재 경로: tibialis anterior 8.7 → Interosseous membrane leg 36.1 → tibialis posterior 40.3 → popliteal artery 48.9 → soleus 59.5 → Lateral head gastrocnemius 78.9
- 근접 미표시: anterior tibial artery 4.7mm옆@40.1; Tibial nerve 2.6mm옆@59.3
- 근거: Choi 2026 초음파 https://doi.org/10.1016/j.imr.2026.101305: 앞정강동맥 HD50 25 mm (모델 15 mm 깊음)
- 제안: 근접 표시, 깊이 차이 표기

판정:

### ST40 [종아리] 🟠 중대
- 원문: 0.5～1寸 直刺 (모델 상한 23.8 mm)
- 현재 경로: tibialis anterior 6.4 → Interosseous membrane leg 24.3 → tibialis posterior 26.7 → soleus 52.3
- 방향 보정 시 (39° 편차): extensor digitorum longus 15 → fibularis longus 29.7 → soleus 48.8 → Lateral head gastrocnemius 58.1
- 빈 구간: 42→52mm(soleus 앞)
- 근접 미표시: Deep fibular nerve 3.4mm옆@25.8

판정: 근접 수정 대기. 

## 🟡 보통 (108혈)

### CV23 [목·어깨윗부분] 🟡 보통
- 원문: 直刺 0.2～0.3寸 (모델 상한 5.5 mm)
- 현재 경로: platysma 5 → mylohyoid 18.9 → geniohyoid 21 → genioglossus 23.5 → Tongue 31.9 → Gingiva of upper jaw 59.9
- 방향 보정 시 (15° 편차): platysma 5.5 → Mandible 13
- 빈 구간: 8→19mm(mylohyoid 앞); 49→60mm(Gingiva of upper jaw 앞)
- 이전 txt 판정: 승인

판정: 

### GV14 [목·어깨윗부분] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Transverse part trapezius 11.9 → Transverse part trapezius 12.9 → splenius capitis 19.5 → splenius capitis 19.6 → rhomboid major 21 → serratus posterior superior 21.6 → First thoracic vertebra 24.2
- 빈 구간: 0→12mm(Transverse part trapezius 앞)

판정:

### LI17 [목·어깨윗부분] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 9.1 mm)
- 기대 층: 넓은목근 → 흉쇄유돌근 뒤모서리 → 목갈비근 사이 상완신경얼기
- 문제: 상완신경얼기 뿌리 교차 @18.7은 해부학적으로 타당. 흉쇄유돌근 누락
- 현재 경로: platysma 11.1 → Roots of brachial plexus 18.7 → scalenus medius 21.2 → scalenus posterior 31.2 → Intertransverse ligamentsr 36.3 → Seventh cervical vertebra 41.8
- 빈 구간: 0→11mm(platysma 앞)
- 근접 미표시: superficial cervical artery 1.9mm옆@8.4; Glossopharyngeal nerve (IX) 3.4mm옆@24.1; Dorsal scapular nerve 4.3mm옆@35.4
- 근거: 해부
- 제안: —
- 이전 txt 판정: 반려: 자침부가 흉쇄유돌근 뒷모서리에 바로 붙어야됨. 수평 이동 필요하고, 자침 경로에 흉쇄유돌근이 없는지 재검침 요망. 깊이가 안되는건지?

판정: 

### SI14 [목·어깨윗부분] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 등세모근 → 어깨올림근·작은마름근 → 위뒤톱니근 → 척추세움근 → 늑간 → 흉막
- 문제: 층 순서 타당. 흉막 61.5 mm(문헌 52). 작은마름근 누락 가능
- 현재 경로: Transverse part trapezius 11.1 → levator scapulae 32.9 → serratus posterior superior 40.8 → iliocostalis cervicis 43.1 → longissimus thoracis 46.2 → levatores costarum longi 49 → external intercostal muscle 52.2 → Pleura 61.5
- 방향 보정 시 (23° 편차): Transverse part trapezius 12.3 → levator scapulae 35.7 → serratus posterior superior 48.7 → iliocostalis thoracis 52.6 → third rib 57.8
- 빈 구간: 0→11mm(Transverse part trapezius 앞); 21→33mm(levator scapulae 앞)
- 근접 미표시: Dorsal scapular nerve 2.4mm옆@36.3; Posterior intercostal arteries 4.1mm옆@57.6; anterior intercostal veins 3.4mm옆@60.3
- 근거: Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819: 52 mm
- 제안: 깊이 차이 표기
- 이전 txt 판정: 반려: 자침 가이드를 키면 T1 극돌기를 가르켜야 하는데, T2를 가르킨다.

판정: 

### TE16 [목·어깨윗부분] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (不宜深刺) (모델 상한 9.1 mm)
- 기대 층: 흉쇄유돌근 뒤 → 머리널판근 → 목혈관
- 문제: 척추동맥 1.5 mm 옆 @30.7 (깊이는 문헌과 일치, 혈관 종류는 원문 확인 필요). 흉쇄유돌근 누락
- 현재 경로: splenius capitis 14.1 → splenius cervicis 16.5 → posterior cervical intertransversarii 21.5 → longissimus capitis 22.9 → Axis 34.7
- 빈 구간: 0→14mm(splenius capitis 앞); 24→35mm(Axis 앞)
- 근접 미표시: vertebral artery 1.5mm옆@30.7
- 근거: Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819: 31 mm
- 제안: 근접 표시
- 이전 txt 판정: 반려: 유양돌기를 타겟하는 것으로 가야되는데, 유양돌기쪽을 하기에 SCM 랜더링이 너무 굵다. 근본 문제 해결. 또, 노회혈 위치가 다시 잘못됬따.

판정: 

### KI23 [가슴] 🟡 보통
- 원문: 直刺 0.2～0.4寸 (모델 상한 6.8 mm)
- 현재 경로: Sternocostal part pectoralis major 4.3 → internal intercostal muscle 21 → Pleura 34.7
- 빈 구간: 25→35mm(Pleura 앞)
- 근접 미표시: Intercostal nerves 3.3mm옆@33.2
- 이전 txt 판정: 승인

판정: 

### KI24 [가슴] 🟡 보통
- 원문: 直刺 0.2～0.4寸 (不可深刺) (모델 상한 6.8 mm)
- 현재 경로: Sternocostal part pectoralis major 6.2 → internal intercostal muscle 24.4 → Pleura 38
- 빈 구간: 26→38mm(Pleura 앞)
- 이전 txt 판정: 반려: 늑간 사이로 침이 향하질 않는다. 조금의 미세 수정 필요.

판정: 

### KI27 [가슴] 🟡 보통
- 원문: 直刺 0.2～0.4寸 (不可深刺) (모델 상한 6.8 mm)
- 현재 경로: Sternocostal part pectoralis major 14.2 → first costal cartilage 24.4
- 빈 구간: 0→14mm(Sternocostal part pectoralis major 앞)
- 근접 미표시: anterior intercostal veins 1.5mm옆@26.2
- 이전 txt 판정: 반려: 쇄골 바로 아래가 아니라 1번째 갈비사이공간을 향하는 것으로 보이는 중대 오류

판정: 

### PC1 [가슴] 🟡 보통
- 원문: 直刺 0.2～0.3寸 (不宜深刺) (모델 상한 5.1 mm)
- 현재 경로: Sternocostal part pectoralis major 3.1 → external intercostal muscle 33 → internal intercostal muscle 35 → innermost intercostal muscle 36.3 → Pleura 44.2
- 근접 미표시: Lateral pectoral nerve 4.8mm옆@3.4

판정:

### SP17 [가슴] 🟡 보통
- 원문: 直刺 0.2～0.3寸 (不宜深刺) (모델 상한 5.1 mm)
- 현재 경로: Sternocostal part pectoralis major 13.1 → external intercostal muscle 37.9 → internal intercostal muscle 39.6 → innermost intercostal muscle 40.5 → Pleura 49.5
- 빈 구간: 0→13mm(Sternocostal part pectoralis major 앞)
- 근접 미표시: Lateral pectoral nerve 0.9mm옆@12.7
- 이전 txt 판정: 반려: 침 방향이 5늑간 사이가 아니라 약간 위쪽이다. 위치의 경우도, 유두~겨드랑이선 중점인데, 위치도 잘못된듯.

판정: 

### SP19 [가슴] 🟡 보통
- 원문: 直刺 0.2～0.3寸 (不宜深刺) (모델 상한 5.1 mm)
- 현재 경로: Sternocostal part pectoralis major 8.3 → Sternocostal part pectoralis major 22.2 → pectoralis minor 32.7 → external intercostal muscle 43.5 → internal intercostal muscle 45.2 → innermost intercostal muscle 46.5 → Pleura 53.6
- 근접 미표시: Lateral pectoral nerve 1.2mm옆@12.2
- 이전 txt 판정: 반려: 동일하게 유두~겨드랑이선 중점으로 다시 할것. 근데 유두 위치도 수정 필요할듯.

판정: 

### SP20 [가슴] 🟡 보통
- 원문: 直刺 0.2～0.4寸 (모델 상한 6.8 mm)
- 현재 경로: Clavicular part pectoralis major 13.4 → Sternocostal part pectoralis major 20.9 → pectoralis minor 30.7 → external intercostal muscle 49.6 → internal intercostal muscle 50.6 → Posterior intercostal arteries 51.7 → innermost intercostal muscle 52.5 → Pleura 58.9
- 빈 구간: 0→13mm(Clavicular part pectoralis major 앞)
- 근접 미표시: lateral thoracic artery 4.3mm옆@51.9; anterior intercostal veins 0.2mm옆@52; Intercostal nerves 1.7mm옆@56.5
- 이전 txt 판정: 반려: 늑간 사이로 침방향이 설정된게 아니다. 이걸 수정하고, 유두~겨드랑이선으로 재조정해라.

판정: 

### SP21 [가슴] 🟡 보통
- 원문: 直刺 0.2～0.3寸 (不宜深刺) (모델 상한 5.1 mm)
- 현재 경로: serratus anterior 19.6 → external intercostal muscle 26.8 → internal intercostal muscle 29.6 → innermost intercostal muscle 29.7 → Pleura 35.6
- 빈 구간: 0→20mm(serratus anterior 앞)
- 이전 txt 판정: 승인

판정: 

### ST13 [가슴] 🟡 보통
- 원문: 直刺 0.2～0.3寸 (모델 상한 5.1 mm)
- 현재 경로: Clavicular part pectoralis major 12.3 → external intercostal muscle 28.3 → Pleura 36.6
- 빈 구간: 0→12mm(Clavicular part pectoralis major 앞)
- 근접 미표시: Medial pectoral nerve 3.4mm옆@32
- 이전 txt 판정: 반려: 사자 혹은 횡자이기도 하고, 그리고 쇄골 하부에 딱 붙이기만 하면 될듯.

판정: 

### ST18 [가슴] 🟡 보통
- 원문: 直刺 0.2～0.3寸 (모델 상한 5.1 mm)
- 현재 경로: Sternocostal part pectoralis major 0 → internal intercostal muscle 17.2 → Pleura 27.7
- 근접 미표시: Intercostal nerves 0.2mm옆@22.6; Posterior intercostal arteries 2.7mm옆@26.1; anterior intercostal veins 3.8mm옆@26.9
- 이전 txt 판정: 승인

판정: 

### BL11 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 등세모근 → 작은마름근 → 위뒤톱니근 → 목널판근 → 척추세움근 → 늑간 → 흉막
- 문제: 층 사이 공백 11~12 mm 두 곳, 가장긴근 1.6 mm, 목널판근 누락. 흉막 64 mm
- 현재 경로: Transverse part trapezius 10.3 → rhomboid minor 28 → serratus posterior superior 40.7 → longissimus thoracis 45.8 → external intercostal muscle 54.4 → Pleura 63.9
- 방향 보정 시 (15° 편차): Transverse part trapezius 10.7 → serratus posterior superior 42.5 → longissimus thoracis 46 → levatores costarum longi 52.5 → levatores costarum longi 56.6 → levatores costarum breves 57.3 → external intercostal muscle 59.8 → Pleura 67.8
- 빈 구간: 0→10mm(Transverse part trapezius 앞); 17→28mm(rhomboid minor 앞)
- 근접 미표시: Posterior intercostal arteries 2.2mm옆@58.3; Intercostal nerves 3.3mm옆@59.4; anterior intercostal veins 3.2mm옆@61.1
- 근거: 리뷰 인용(Lian): BL11~21 자침깊이 12~40 mm
- 제안: 공백 라벨, 정합 확인
- 이전 txt 판정: 승인

판정: 

### BL12 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 9.2 → Transverse part trapezius 11.5 → rhomboid minor 32.1 → serratus posterior superior 39.5 → longissimus cervicis 46.8 → levatores costarum longi 48.4 → levatores costarum breves 52.8 → external intercostal muscle 54.8 → Pleura 65.1
- 빈 구간: 16→32mm(rhomboid minor 앞)
- 이전 txt 판정: 반려: 자침 가이드에서 표시하는 해당하는 척추분절의 극돌기를 들고와라

판정: 

### BL13 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 등세모근 → 큰마름근 → 척추세움근 → 늑간 → 흉막
- 문제: 층 사이 공백 13 mm, 흉막 62 mm
- 현재 경로: Ascending part trapezius 8.7 → rhomboid major 33 → longissimus thoracis 40.2 → levatores costarum longi 47.5 → external intercostal muscle 50.5 → Posterior intercostal arteries 58.2 → Pleura 61.9
- 빈 구간: 20→33mm(rhomboid major 앞)
- 근접 미표시: Intercostal nerves 0.5mm옆@56.8; anterior intercostal veins 1.5mm옆@60.9
- 근거: 같음
- 제안: 공백 라벨
- 이전 txt 판정: 승인

판정: 

### BL14 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 11 → rhomboid major 29.3 → longissimus thoracis 35.9 → levatores costarum longi 39.3 → fifth rib 48.6
- 빈 구간: 0→11mm(Ascending part trapezius 앞)
- 이전 txt 판정: 승인

판정: 

### BL15 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 12.9 → rhomboid major 19.3 → longissimus thoracis 23.9 → levatores costarum longi 31.1 → Pleura 47.4
- 방향 보정 시 (16° 편차): Ascending part trapezius 13.7 → rhomboid major 19.1 → longissimus thoracis 25.7 → external intercostal muscle 35.8 → sixth rib 40.1
- 빈 구간: 0→13mm(Ascending part trapezius 앞); 35→47mm(Pleura 앞)
- 이전 txt 판정: 승인

판정: 

### BL16 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 9 → longissimus thoracis 25.4 → levatores costarum breves 35.5 → external intercostal muscle 39.6 → Pleura 48
- 빈 구간: 14→25mm(longissimus thoracis 앞)
- 근접 미표시: Intercostal nerves 3.3mm옆@48.3
- 이전 txt 판정: 승인

판정: 

### BL17 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 6.3 → latissimus dorsi 11.2 → longissimus thoracis 24.2 → levatores costarum longi 33.6 → external intercostal muscle 38.2 → Posterior intercostal arteries 41.4 → Pleura 47.1
- 근접 미표시: anterior intercostal veins 1.9mm옆@41.8
- 이전 txt 판정: 승인

판정: 

### BL18 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: latissimus dorsi 14.1 → longissimus thoracis 23.4 → levatores costarum longi 29.6 → levatores costarum breves 34.4 → external intercostal muscle 37.8 → tenth rib 38.1
- 빈 구간: 0→14mm(latissimus dorsi 앞)
- 이전 txt 판정: 승인

판정: 

### BL19 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: latissimus dorsi 11.6 → longissimus thoracis 19.7 → levatores costarum breves 34 → external intercostal muscle 34.1 → Pleura 48.5
- 빈 구간: 0→12mm(latissimus dorsi 앞); 36→49mm(Pleura 앞)
- 이전 txt 판정: 반려: 자침 가이드에서 해당하는 척추분절의 극돌기를 들고와라. 척추 둘레를 표시하는게 다른곳에 가있음.

판정: 

### BL20 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: latissimus dorsi 7 → serratus posterior inferior 14.6 → longissimus thoracis 21.8 → longissimus thoracis 29.8 → internal intercostal muscle 42.9 → Diaphragm 50.2 → Hepatovenous segment VII 80.7
- 빈 구간: 53→81mm(Hepatovenous segment VII 앞)
- 이전 txt 판정: 반려: 자침 가이드에서 해당하는 척추분절의 극돌기를 들고와라. 척추 둘레 표시가 다른곳.

판정: 

### BL21 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: latissimus dorsi 6.1 → serratus posterior inferior 13.3 → longissimus thoracis 23.2 → longissimus thoracis 32.1 → lateral lumbar intertransversarius 57
- 방향 보정 시 (17° 편차): latissimus dorsi 5.7 → serratus posterior inferior 12.7 → longissimus thoracis 26.4 → kidney 79
- 빈 구간: 42→57mm(lateral lumbar intertransversarius 앞)
- 근접 미표시: Ilio-inguinal nerve 1.4mm옆@64; Iliohypogastric nerve 1.1mm옆@64.1
- 이전 txt 판정: 반려: 자침 가이드 척추뼈 표시 안되있음.

판정: 

### BL25 [등·허리] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 20.2 mm)
- 기대 층: (L4) 척추세움근·뭇갈래근 → 가로돌기
- 문제: 허리네모근 16 mm 두께로 나옴, 뭇갈래근 누락. L5 46.9 mm
- 현재 경로: latissimus dorsi 11.6 → iliocostalis lumborum 19.1 → quadratus lumborum 30.8 → Fifth lumbar vertebra 46.9
- 빈 구간: 0→12mm(latissimus dorsi 앞)
- 근거: 요추 MRI 2020 https://doi.org/10.1016/j.imr.2020.100679: L4 가로돌기 57 mm
- 제안: 정합

판정:

### BL41 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 12.6 → levator scapulae 35.9 → dorsal scapular artery 36.9 → serratus posterior superior 40.6 → iliocostalis cervicis 43.6 → longissimus thoracis 47.7 → fourth rib 50.5
- 빈 구간: 0→13mm(Ascending part trapezius 앞); 24→36mm(levator scapulae 앞)
- 이전 txt 판정: 반려: 자침 가이드에서 나오는 뼈가 T1.

판정: 

### BL45 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 2.9 → rhomboid major 22.6 → longissimus thoracis 32.4 → seventh rib 33.5
- 빈 구간: 10→23mm(rhomboid major 앞)
- 이전 txt 판정: 승인

판정: 

### BL46 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: latissimus dorsi 9.3 → iliocostalis thoracis 24.8 → levatores costarum longi 29.4 → levatores costarum breves 30.9 → external intercostal muscle 31.9 → eighth rib 32.2
- 빈 구간: 15→25mm(iliocostalis thoracis 앞)
- 이전 txt 판정: 승인

판정: 

### BL47 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: latissimus dorsi 11.9 → levatores costarum longi 22.8 → external intercostal muscle 28.5 → levatores costarum breves 29.4 → tenth rib 30.7
- 빈 구간: 0→12mm(latissimus dorsi 앞)
- 이전 txt 판정: 승인

판정: 

### BL48 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: latissimus dorsi 4.6 → serratus posterior inferior 12.7 → iliocostalis lumborum 17.4 → iliocostalis thoracis 20.7 → levatores costarum longi 26.3 → external intercostal muscle 27.2 → Diaphragm 55.1 → Hepatovenous segment VIII 63.7
- 빈 구간: 29→55mm(Diaphragm 앞)
- 근접 미표시: Posterior intercostal arteries 4.1mm옆@28.8; Lower lobe lung 4mm옆@49.8; Pleura 3.4mm옆@51.4

판정:

### BL50 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.6寸 (모델 상한 12.1 mm)
- 현재 경로: latissimus dorsi 3.4 → serratus posterior inferior 10.9 → iliocostalis lumborum 14.9 → twelfth rib 33.7
- 빈 구간: 20→34mm(twelfth rib 앞)

판정:

### GV3 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 가시끝인대 → 가시사이인대 → 황색인대 → 경막·말총
- 문제: 가시사이인대 누락(메시는 존재), 말총 0.9 mm 근접 미표시
- 현재 경로: latissimus dorsi 16 → interspinales lumborum 29.1 → Ligamenta flava 41.9 → Fifth lumbar vertebra 59
- 빈 구간: 0→16mm(latissimus dorsi 앞); 18→29mm(interspinales lumborum 앞); 31→42mm(Ligamenta flava 앞); 42→59mm(Fifth lumbar vertebra 앞)
- 근접 미표시: Cauda equina 0.9mm옆@57.2
- 근거: 해부
- 제안: 근접 표시

판정:

### GV6 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 9.8 → serratus posterior inferior 15.4 → Supraspinous ligament 15.7 → Twelfth thoracic vertebra 31
- 빈 구간: 16→31mm(Twelfth thoracic vertebra 앞)

판정:

### GV7 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 1.7 → Ascending part trapezius 2.1 → Supraspinous ligament 9.6 → Eleventh thoracic vertebra 20
- 빈 구간: 10→20mm(Eleventh thoracic vertebra 앞)

판정:

### GV8 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 1.5 → Supraspinous ligament 8 → Tenth thoracic vertebra 18.6
- 빈 구간: 9→19mm(Tenth thoracic vertebra 앞)

판정:

### GV10 [등·허리] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Ascending part trapezius 11.3 → spinalis thoracis 19.9 → semispinalis thoracis 24.9 → Seventh thoracic vertebra 32.7
- 빈 구간: 0→11mm(Ascending part trapezius 앞)

판정:

### BL29 [엉치·볼기] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 20.2 mm)
- 현재 경로: gluteus maximus 27.1 → piriformis 58.9
- 빈 구간: 0→27mm(gluteus maximus 앞)
- 근접 미표시: inferior gluteal vein 3.5mm옆@64.9

판정:

### GV1 [엉치·볼기] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: gluteus maximus 16.7 → Sacrum 17.7
- 빈 구간: 0→17mm(gluteus maximus 앞)

판정:

### GV2 [엉치·볼기] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: Sacrum 19.1
- 빈 구간: 0→19mm(Sacrum 앞)

판정:

### CV2 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: Linea alba 36.9 → Distal part of ileum 41.4
- 빈 구간: 0→37mm(Linea alba 앞)
- 이전 txt 판정: 승인

판정: 

### CV5 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: Linea alba 24 → Proximal part of ileum 29.9
- 빈 구간: 0→24mm(Linea alba 앞)
- 이전 txt 판정: 승인

판정: 

### CV6 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: Linea alba 22.9 → Proximal part of ileum 28.7
- 빈 구간: 0→23mm(Linea alba 앞)
- 이전 txt 판정: 승인

판정: 

### CV7 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: Linea alba 21.4 → Distal part of jejunum 27.2
- 빈 구간: 0→21mm(Linea alba 앞)
- 이전 txt 판정: 승인

판정: 

### CV9 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: Linea alba 13.7 → Distal part of jejunum 25.9
- 빈 구간: 0→14mm(Linea alba 앞)
- 이전 txt 판정: 승인

판정: 

### CV11 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: Linea alba 15.1 → gastro-epiploic artery 36.7 → gastroepiploic vein 39.5 → Transverse mesocolon 40
- 빈 구간: 0→15mm(Linea alba 앞); 17→37mm(gastro-epiploic artery 앞)
- 근접 미표시: Middle colic artery 2mm옆@32.7; Middle colic vein 3.3mm옆@34.9

판정:

### CV13 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: Linea alba 12.1 → Hepatovenous segment III 19.5
- 빈 구간: 0→12mm(Linea alba 앞)

판정:

### CV14 [배·샅] 🟡 보통
- 원문: 直刺 4～8分 (不宜深刺) (모델 상한 13.6 mm)
- 현재 경로: Linea alba 12 → Hepatovenous segment III 17.4
- 빈 구간: 0→12mm(Linea alba 앞)
- 이전 txt 판정: 승인

판정: 

### GB27 [배·샅] 🟡 보통
- 원문: 直刺 0.5～0.8寸 (모델 상한 23.8 mm)
- 현재 경로: internal oblique 14.8 → transversus abdominis 20.2 → inguinal ligament 30.7 → iliacus 46.1 → hip bone 73.3
- 빈 구간: 0→15mm(internal oblique 앞); 36→46mm(iliacus 앞)
- 근접 미표시: Ilio-inguinal nerve 0.8mm옆@40.2

판정:

### KI14 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 21.8 → internal oblique 23.1 → internal oblique 26.2 → rectus abdominis 28.3 → transversus abdominis 34.3 → Proximal part of ileum 37.3
- 빈 구간: 0→22mm(external oblique 앞)

판정:

### KI15 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 19 → internal oblique 19.4 → internal oblique 20.1 → rectus abdominis 20.9 → transversus abdominis 32.7 → Mesentery of small intestine 58.6
- 빈 구간: 0→19mm(external oblique 앞); 34→59mm(Mesentery of small intestine 앞)
- 근접 미표시: superficial epigastric vein 4.4mm옆@2.4; Distal part of jejunum 3mm옆@31.8; Proximal part of ileum 2.3mm옆@34.2; Intercostal nerves 4.8mm옆@42.7

판정:

### KI16 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: internal oblique 17.1 → external oblique 18 → internal oblique 19.6 → transversus abdominis 19.6 → rectus abdominis 20.7 → Distal part of jejunum 34
- 방향 보정 시 (23° 편차): external oblique 14.1 → internal oblique 15.8 → internal oblique 16.8 → rectus abdominis 18.1 → transversus abdominis 31.8 → Distal part of jejunum 35.6
- 빈 구간: 0→17mm(internal oblique 앞)

판정:

### KI17 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 14 → internal oblique 14.9 → rectus abdominis 17.7 → internal oblique 19.6 → transversus abdominis 23.3 → Transverse colon 25.6
- 방향 보정 시 (24° 편차): external oblique 11.7 → internal oblique 12.4 → rectus abdominis 14 → internal oblique 25.7 → transversus abdominis 26.9 → Transverse colon 31.8
- 빈 구간: 0→14mm(external oblique 앞)

판정:

### KI19 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 9.2 → internal oblique 9.9 → rectus abdominis 11.4 → internal oblique 25.7 → transversus abdominis 26.2 → Stomach 51.3
- 빈 구간: 27→51mm(Stomach 앞)
- 근접 미표시: superior epigastric artery 3.7mm옆@18.7

판정:

### KI20 [배·샅] 🟡 보통
- 원문: 直刺 0.3～0.8寸 (모델 상한 23.8 mm)
- 현재 경로: external oblique 9.8 → internal oblique 10.7 → rectus abdominis 12.8 → internal oblique 20.8 → transversus abdominis 21.6 → Hepatovenous segment IV 24.3
- 근접 미표시: superior epigastric artery 1.2mm옆@14

판정:

### KI21 [배·샅] 🟡 보통
- 원문: 直刺 0.3～0.7寸 (禁深刺) (모델 상한 20.8 mm)
- 현재 경로: external oblique 7.8 → internal oblique 7.9 → rectus abdominis 10.2 → internal oblique 19.8 → transversus abdominis 20.2 → Hepatovenous segment IV 23
- 근접 미표시: superior epigastric artery 1.8mm옆@12.5

판정:

### LR13 [배·샅] 🟡 보통
- 원문: 直刺 0.5～0.8寸 (不宜深刺) (모델 상한 13.6 mm)
- 현재 경로: external oblique 15.1 → transversus abdominis 21 → Taenia omentalis 28.6 → Ascending colon 29.1
- 빈 구간: 0→15mm(external oblique 앞)
- 이전 txt 판정: 승인

판정: 

### SP13 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 17.8 → internal oblique 18.2 → transversus abdominis 23.9 → psoas major 51.2 → hip bone 76.4
- 빈 구간: 0→18mm(external oblique 앞); 28→51mm(psoas major 앞); 65→76mm(hip bone 앞)
- 근접 미표시: Distal part of ileum 3.8mm옆@46.4; testicular vein 3.5mm옆@54.8

판정:

### SP14 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 9.5 → internal oblique 16.9 → internal oblique 18.6 → transversus abdominis 23.9 → Proximal part of ileum 41.4
- 빈 구간: 26→41mm(Proximal part of ileum 앞)

판정:

### SP15 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 13.8 → internal oblique 16.8 → internal oblique 19.3 → transversus abdominis 26 → Distal part of jejunum 35.5
- 빈 구간: 0→14mm(external oblique 앞)

판정:

### SP16 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 8.3 → rectus abdominis 11.8 → internal oblique 14.7 → transversus abdominis 19.8 → internal oblique 21.9 → Transverse mesocolon 47.7
- 빈 구간: 23→48mm(Transverse mesocolon 앞)
- 근접 미표시: Gallbladder 2.3mm옆@44.7; Transverse colon 1.6mm옆@48.2; Middle colic artery 2.8mm옆@52.2

판정:

### ST19 [배·샅] 🟡 보통
- 원문: 直刺 0.5～0.8寸 (모델 상한 23.8 mm)
- 현재 경로: external oblique 7.2 → rectus abdominis 9.5 → Hepatovenous segment IV 21.3
- 근접 미표시: musculophrenic artery 2.1mm옆@20.6

판정:

### ST22 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 7.6 → internal oblique 8.5 → rectus abdominis 10.5 → transversus abdominis 30 → internal oblique 30.2 → Transverse mesocolon 48.4
- 빈 구간: 32→48mm(Transverse mesocolon 앞)
- 근접 미표시: Intercostal nerves 3.1mm옆@30.1; Marginal colic artery 1.4mm옆@44.9; Marginal artery of colon 1.4mm옆@44.9

판정:

### ST25 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 16.9 → internal oblique 17 → rectus abdominis 18.5 → transversus abdominis 31.5 → internal oblique 32.6 → Distal part of jejunum 35.3
- 빈 구간: 0→17mm(external oblique 앞)
- 근접 미표시: inferior epigastric vein 4.2mm옆@35.6; Distal part of jejunum 2.9mm옆@39.3

판정:

### ST26 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: internal oblique 12.3 → external oblique 13.4 → rectus abdominis 16.9 → internal oblique 25.4 → transversus abdominis 32.8 → Mesentery of small intestine 63.1
- 방향 보정 시 (22° 편차): internal oblique 16.8 → external oblique 17.7 → rectus abdominis 21.4 → internal oblique 23.3 → transversus abdominis 40.9 → Distal part of jejunum 41.8
- 빈 구간: 0→12mm(internal oblique 앞); 36→63mm(Mesentery of small intestine 앞)
- 근접 미표시: superficial epigastric vein 1.5mm옆@0; superficial epigastric artery 2mm옆@0; inferior epigastric vein 2.4mm옆@34.5; Distal part of jejunum 0.8mm옆@37.7; Proximal part of ileum 1.5mm옆@37.8

판정:

### ST27 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 12.1 → rectus abdominis 12.7 → internal oblique 13.1 → rectus abdominis 29.3 → internal oblique 30.1 → transversus abdominis 35.6 → Middle part of ileum 38.2
- 빈 구간: 0→12mm(external oblique 앞)
- 근접 미표시: superficial epigastric vein 4.6mm옆@0; inferior epigastric vein 3.7mm옆@30.7; Proximal part of ileum 4.9mm옆@38; Middle part of ileum 1.3mm옆@38.4

판정:

### ST28 [배·샅] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: superficial epigastric vein 0.9 → internal oblique 16.8 → external oblique 18 → internal oblique 19.2 → rectus abdominis 20.3 → transversus abdominis 28.6 → Middle part of ileum 35.2
- 빈 구간: 4→17mm(internal oblique 앞)

판정:

### ST30 [배·샅] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 14.9 mm)
- 기대 층: 배바깥빗근 널힘줄 → 샅고랑굴(정삭)
- 문제: 정관·고환동정맥 1~2.6 mm 근접 미표시, 방향 51°
- 현재 경로: external oblique 21.3 → internal oblique 25.3 → transversus abdominis 27.8 → Distal part of ileum 31.7
- 방향 보정 시 (51° 편차): external oblique 39.6 → external oblique 41.5 → transversus abdominis 42.7 → internal oblique 42.9 → rectus abdominis 45 → external oblique 45.3 → rectus abdominis 48.5 → rectus abdominis 61.3 → rectus abdominis 63.9 → Middle part of ileum 71.1
- 빈 구간: 0→21mm(external oblique 앞)
- 근접 미표시: superficial epigastric vein 1.7mm옆@17; testicular vein 2.6mm옆@25.8; testicular artery 1.1mm옆@28.3
- 근거: 해부
- 제안: 근접 표시
- 이전 txt 판정: 반려: 교과서상으로는 직자 0.5~1촌으로 배웠는데 내가 틀린건가. 그리고 위험 구조물인 넙다리동맥에 대한 경고가 없다. 자침 시뮬레이터 자체도 지나는게 단 한개도 없는데 다시 재검수해라. 복직근쪽이나 샅고랑힘줄 주변으로.

판정: 

### LI14 [어깨·견갑] 🟡 보통
- 원문: 直刺 0.3～0.7寸 (모델 상한 14 mm)
- 기대 층: 피하 → 어깨세모근 정지부
- 문제: 피부→삼각근 23 mm
- 현재 경로: Spinal part deltoid 23.1 → humerus 33.7
- 빈 구간: 0→23mm(Spinal part deltoid 앞)
- 근거: Störchle 2018 초음파 https://doi.org/10.1038/s41598-018-34213-0: 일반인 피하지방 3~10 mm
- 제안: 피하 두께 정합 확인

판정:

### TE14 [어깨·견갑] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 20.2 mm)
- 기대 층: 어깨세모근 → 가시아래근/작은원근 힘줄 → 관절주머니
- 문제: 방향 30°로 사각공간 쪽, 겨드랑신경 0.3 mm @77
- 현재 경로: Spinal part deltoid 8.7 → teres minor 33 → Long head triceps brachii 57.9
- 방향 보정 시 (16° 편차): Spinal part deltoid 8.9 → teres minor 35.6 → Long head triceps brachii 61.9 → teres major 72.6
- 근접 미표시: circumflex scapular vein 0.9mm옆@67.1
- 근거: 해부
- 제안: 방향 보정

판정:

### LI12 [위팔·팔꿈치] 🟡 보통
- 원문: 直刺 0.3～0.7寸 (모델 상한 14 mm)
- 현재 경로: brachioradialis 16.8 → brachialis 32.5
- 빈 구간: 0→17mm(brachioradialis 앞)
- 근접 미표시: inferior ulnar collateral artery 3.3mm옆@64.5; brachial artery 2.8mm옆@67.6

판정:

### LU4 [위팔·팔꿈치] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10 mm)
- 현재 경로: Long head biceps brachii 15.2 → brachialis 28.8 → humerus 32.7
- 빈 구간: 0→15mm(Long head biceps brachii 앞)
- 근접 미표시: cephalic vein 1.7mm옆@18.9

판정:

### TE10 [위팔·팔꿈치] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10 mm)
- 기대 층: 세갈래근 힘줄 → 팔꿈치오목 지방 → 뼈
- 문제: 피부→세갈래근 19.7 mm
- 현재 경로: Long head triceps brachii 19.7 → Lateral head triceps brachii 25.2 → Medial head triceps brachii 31.1 → humerus 40.7
- 빈 구간: 0→20mm(Long head triceps brachii 앞)
- 근거: Störchle 2018 초음파 https://doi.org/10.1038/s41598-018-34213-0
- 제안: 피하 두께 정합

판정:

### TE11 [위팔·팔꿈치] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 10 mm)
- 현재 경로: Long head triceps brachii 19.2 → Medial head triceps brachii 36.4 → humerus 42.2
- 빈 구간: 0→19mm(Long head triceps brachii 앞)

판정:

### TE12 [위팔·팔꿈치] 🟡 보통
- 원문: 直刺 0.3～0.7寸 (모델 상한 14 mm)
- 현재 경로: Long head triceps brachii 16.7 → Lateral head triceps brachii 38.8 → Medial head triceps brachii 45.9 → humerus 48.9
- 빈 구간: 0→17mm(Long head triceps brachii 앞)
- 근접 미표시: deep brachial artery 1.9mm옆@46.6

판정:

### LI6 [아래팔] 🟡 보통
- 원문: 直刺 0.3～0.5寸 (모델 상한 11.2 mm)
- 현재 경로: brachioradialis 11.8 → flexor pollicis longus 15.2 → radius 15.7
- 빈 구간: 0→12mm(brachioradialis 앞)
- 근접 미표시: cephalic vein 3mm옆@11; radial artery 2.5mm옆@14.9

판정:

### LI7 [아래팔] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 22.4 mm)
- 현재 경로: brachioradialis 6.9 → flexor pollicis longus 20.7 → flexor digitorum profundus 31.2 → Humeral head flexor carpi ulnaris 66.4 → basilic vein 72.3
- 근접 미표시: anterior interosseous artery 3.1mm옆@39.4

판정:

### LI9 [아래팔] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 22.4 mm)
- 현재 경로: brachioradialis 3.5 → supinator 24.6 → ulna 49.2
- 근접 미표시: recurrent interosseous artery 1.9mm옆@47

판정:

### LU6 [아래팔] 🟡 보통
- 원문: 直刺 0.5～1寸 (留3呼) (모델 상한 22.4 mm)
- 현재 경로: cephalic vein 4.3 → brachioradialis 6 → Humeral head pronator teres 15.1 → Ulnar head pronator teres 18.7 → flexor digitorum superficialis 24.5 → radius 26.6
- 근접 미표시: radial vein 1.3mm옆@22.1

판정:

### PC5 [아래팔] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 22.4 mm)
- 기대 층: PC4와 같음
- 문제: 정중신경 2.3 mm 근접 미표시
- 현재 경로: flexor carpi radialis 0.5 → flexor digitorum superficialis 3.2 → flexor digitorum profundus 8.7 → Interosseous membrane forearm 22.4 → extensor pollicis brevis 25.8 → Anterior interosseous nerve of forearm 27 → abductor pollicis longus 37.5 → extensor digitorum 39.9
- 근접 미표시: Median nerve 2.3mm옆@14.4; anterior interosseous artery 2.1mm옆@20.3; Posterior interosseous nerve of forearm 2.1mm옆@31.7
- 근거: 해부
- 제안: 근접 표시

판정:

### PC6 [아래팔] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 22.4 mm)
- 기대 층: 얕은손가락굽힘근 → 정중신경 → 깊은손가락굽힘근 → 네모엎침근
- 문제: 정중신경 3.2 mm 근접 미표시
- 현재 경로: flexor digitorum superficialis 3.4 → flexor digitorum superficialis 3.6 → flexor digitorum profundus 7.8 → pronator quadratus 11.3 → extensor pollicis brevis 29 → extensor digitorum 37.5
- 방향 보정 시 (20° 편차): flexor digitorum superficialis 2.6 → flexor digitorum superficialis 4.1 → flexor digitorum profundus 7.2 → pronator quadratus 10.4 → Interosseous membrane forearm 18.6 → extensor indicis 21.4 → extensor digiti minimi 32.7
- 빈 구간: 19→29mm(extensor pollicis brevis 앞)
- 근접 미표시: median antebrachial vein 4.4mm옆@2.4; Median nerve 3.2mm옆@10.7; anterior interosseous artery 4.9mm옆@19.7; Anterior interosseous nerve of forearm 3.9mm옆@23.6; Posterior interosseous nerve of forearm 4.3mm옆@26.4
- 근거: Streitberger(리뷰 인용): 침끝–정중신경 1.8±2.2 mm
- 제안: 근접 표시

판정:

### TE5 [아래팔] 🟡 보통
- 원문: 直刺 0.5～1寸 (혹은 內關(PC6)을 향해 透刺하기도 한다) (모델 상한 22.4 mm)
- 현재 경로: extensor digitorum 11.3 → extensor pollicis longus 15.3 → Interosseous membrane forearm 25.9 → pronator quadratus 31.3 → flexor digitorum profundus 38 → flexor digitorum superficialis 40.1 → flexor digitorum superficialis 43.2 → flexor carpi radialis 45.7
- 빈 구간: 0→11mm(extensor digitorum 앞)
- 근접 미표시: Posterior interosseous nerve of forearm 1.4mm옆@22; Anterior interosseous nerve of forearm 2.7mm옆@24.6; Median nerve 3.1mm옆@36.9; median antebrachial vein 2.5mm옆@46.6

판정:

### TE6 [아래팔] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 22.4 mm)
- 현재 경로: extensor pollicis longus 17.9 → extensor pollicis brevis 27.3 → Interosseous membrane forearm 29.2 → pronator quadratus 30.9 → flexor digitorum profundus 35.3 → flexor digitorum superficialis 44.8 → flexor digitorum superficialis 46.1 → flexor carpi radialis 50.2
- 빈 구간: 0→18mm(extensor pollicis longus 앞)
- 근접 미표시: Anterior interosseous nerve of forearm 3.9mm옆@27.1; anterior interosseous artery 1mm옆@33; Median nerve 2.9mm옆@40.5; median antebrachial vein 1.4mm옆@53.3

판정:

### TE8 [아래팔] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 22.4 mm)
- 현재 경로: extensor digitorum 11.3 → abductor pollicis longus 16.7 → extensor pollicis brevis 27.7 → Interosseous membrane forearm 29.8 → flexor digitorum profundus 34.4 → flexor digitorum superficialis 45.9 → flexor carpi radialis 55.4
- 빈 구간: 0→11mm(extensor digitorum 앞)
- 근접 미표시: Posterior interosseous nerve of forearm 3.3mm옆@25.6; Anterior interosseous nerve of forearm 2.9mm옆@29.1; anterior interosseous artery 4.4mm옆@38; median antebrachial vein 4.5mm옆@61.9

판정:

### BL37 [넓적다리] 🟡 보통
- 원문: 直刺 0.5～1.5寸 (모델 상한 33.4 mm)
- 기대 층: 넙다리두갈래근·반힘줄근 사이 → 큰모음근 (궁둥신경)
- 문제: 궁둥신경 4.7 mm 근접 미표시. 반힘줄근 누락
- 현재 경로: Long head biceps femoris 12.4 → adductor magnus 65.3
- 방향 보정 시 (19° 편차): Long head biceps femoris 13.1 → semimembranosus 56 → adductor magnus 67.1
- 빈 구간: 0→12mm(Long head biceps femoris 앞)
- 근접 미표시: Sciatic nerve 4.7mm옆@53.2
- 근거: 해부
- 제안: 근접 표시

판정:

### GB31 [넓적다리] 🟡 보통
- 원문: 直刺 0.5～1.5寸 (모델 상한 33.4 mm)
- 현재 경로: iliotibial tract 10.8 → vastus lateralis 22.8 → adductor magnus 56.8
- 빈 구간: 0→11mm(iliotibial tract 앞)

판정:

### GB32 [넓적다리] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 22.3 mm)
- 현재 경로: iliotibial tract 3 → vastus lateralis 16.6 → femur 46.4
- 빈 구간: 6→17mm(vastus lateralis 앞)

판정:

### ST31 [넓적다리] 🟡 보통
- 원문: 直刺 0.8～1.5寸 (모델 상한 33.4 mm)
- 기대 층: 넙다리빗근·넙다리근막긴장근 사이 → 넙다리곧은근 (가쪽넙다리휘돌이혈관)
- 문제: 41.6 mm 공백 후 넙다리곧은근
- 현재 경로: rectus femoris 41.6 → femur 76.3
- 방향 보정 시 (18° 편차): sartorius 35.4 → rectus femoris 50.8 → iliacus 75.4 → lateral circumflex femoral artery 79.5
- 빈 구간: 0→42mm(rectus femoris 앞)
- 근거: Störchle 2018 초음파 https://doi.org/10.1038/s41598-018-34213-0
- 제안: 공백 원인 확인

판정:

### ST32 [넓적다리] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 22.3 mm)
- 현재 경로: rectus femoris 10.8 → vastus intermedius 27.9 → femur 62.4
- 빈 구간: 0→11mm(rectus femoris 앞)

판정:

### ST34 [넓적다리] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 22.3 mm)
- 현재 경로: rectus femoris 12 → vastus intermedius 18.5 → femur 46.9
- 빈 구간: 0→12mm(rectus femoris 앞); 31→47mm(femur 앞)

판정:

### LR7 [무릎·오금] 🟡 보통
- 원문: 0.3～0.6寸 直刺 (모델 상한 14.3 mm)
- 현재 경로: semitendinosus 3.2 → tibia 14.7
- 근접 미표시: genicular vein 4.9mm옆@6.9

판정:

### LR8 [무릎·오금] 🟡 보통
- 원문: 0.3～0.8寸 直刺 (모델 상한 17.8 mm)
- 현재 경로: semitendinosus 0.6 → femur 22.1
- 빈 구간: 6→22mm(femur 앞)
- 근접 미표시: great saphenous vein 4.1mm옆@5.1

판정:

### BL55 [종아리] 🟡 보통
- 원문: 0.5～1寸 直刺 (모델 상한 23.8 mm)
- 현재 경로: Lateral head gastrocnemius 20.4 → soleus 50.9 → fibula 67.4
- 빈 구간: 0→20mm(Lateral head gastrocnemius 앞)
- 근접 미표시: Sural nerve 3.9mm옆@22.2

판정:

### BL56 [종아리] 🟡 보통
- 원문: 0.3～1寸 直刺 (모델 상한 23.8 mm)
- 현재 경로: Lateral head gastrocnemius 14.8 → soleus 42.5 → tibialis posterior 75 → tibia 85.8
- 빈 구간: 0→15mm(Lateral head gastrocnemius 앞); 64→75mm(tibialis posterior 앞)
- 근접 미표시: small saphenous vein 2.5mm옆@19.8; posterior tibial artery 2.6mm옆@66.9; fibular vein 4.4mm옆@71.3

판정:

### BL58 [종아리] 🟡 보통
- 원문: 0.5～1.2寸 直刺 (모델 상한 28.6 mm)
- 현재 경로: calcaneal tendon 9.1 → Lateral head gastrocnemius 9.2 → soleus 14.2 → flexor digitorum longus 57.9 → soleus 69.7
- 빈 구간: 39→58mm(flexor digitorum longus 앞)
- 근접 미표시: fibular artery 3.9mm옆@22.5; fibular vein 2.1mm옆@32.7; posterior tibial artery 3.7mm옆@56.5

판정:

### GB35 [종아리] 🟡 보통
- 원문: 0.3～0.8寸 直刺 (모델 상한 19 mm)
- 현재 경로: fibularis longus 8.8 → fibula 16.9
- 근접 미표시: Superficial fibular nerve 4.3mm옆@14.7

판정:

### GB36 [종아리] 🟡 보통
- 원문: 0.3～0.8寸  直刺 (모델 상한 19 mm)
- 현재 경로: extensor digitorum longus 14.2 → fibula 16.8
- 빈 구간: 0→14mm(extensor digitorum longus 앞)
- 근접 미표시: Superficial fibular nerve 2.8mm옆@15.9

판정:

### GB38 [종아리] 🟡 보통
- 원문: 0.3～0.7寸 直刺 (모델 상한 16.7 mm)
- 현재 경로: extensor digitorum longus 5.4 → fibula 10.2
- 근접 미표시: Superficial fibular nerve 0.5mm옆@9.2

판정:

### KI8 [종아리] 🟡 보통
- 원문: 0.3～0.5寸 直刺 (모델 상한 11.9 mm)
- 현재 경로: flexor digitorum longus 6.2 → flexor hallucis longus 22.5 → fibula 48
- 근접 미표시: Tibial nerve 1.1mm옆@22.2

판정:

### KI9 [종아리] 🟡 보통
- 원문: 0.3～0.8寸 直刺 (모델 상한 19 mm)
- 현재 경로: soleus 3.1 → flexor hallucis longus 37.9 → Interosseous membrane leg 54.3 → fibula 58.5
- 빈 구간: 22→38mm(flexor hallucis longus 앞)
- 근접 미표시: posterior tibial vein 2mm옆@3.8; posterior tibial artery 0.6mm옆@20.5

판정:

### LR5 [종아리] 🟡 보통
- 원문: 0.3～0.5寸 直刺를 하거나 (모델 상한 11.9 mm)
- 현재 경로: tibia 8.3
- 근접 미표시: Saphenous nerve 3.1mm옆@8.4

판정:

### LR6 [종아리] 🟡 보통
- 원문: 0.3～0.5寸 直刺 (모델 상한 11.9 mm)
- 현재 경로: tibia 7.3
- 근접 미표시: Saphenous nerve 0.6mm옆@9.6

판정:

### SP7 [종아리] 🟡 보통
- 원문: 0.5～1寸 直刺 (모델 상한 23.8 mm)
- 기대 층: 가자미근/긴발가락굽힘근 → 뒤정강혈관
- 문제: 뒤정강동맥 3 mm 근접 미표시 (평균 법선 경로에선 교차)
- 현재 경로: soleus 3.1 → flexor hallucis longus 47.1 → fibula 61.5
- 빈 구간: 24→47mm(flexor hallucis longus 앞)
- 근접 미표시: posterior tibial artery 3mm옆@24.1; Tibial nerve 2.9mm옆@43.9
- 근거: 해부
- 제안: 근접 표시

판정:

### SP8 [종아리] 🟡 보통
- 원문: 0.5～1寸 直刺 (모델 상한 23.8 mm)
- 현재 경로: Medial head gastrocnemius 6 → soleus 29.7
- 근접 미표시: posterior tibial artery 2.2mm옆@56.8

판정:

### ST37 [종아리] 🟡 보통
- 원문: 0.5～1.5寸 直刺 (모델 상한 35.7 mm)
- 현재 경로: tibialis anterior 4.3 → anterior tibial vein 20.3 → Interosseous membrane leg 28.6 → tibialis posterior 31 → soleus 58.3
- 근접 미표시: anterior tibial artery 3mm옆@17.9; posterior tibial artery 4.1mm옆@62.9

판정:

### ST38 [종아리] 🟡 보통
- 원문: 0.5～1寸 直刺 (모델 상한 23.8 mm)
- 현재 경로: tibialis anterior 1.6 → anterior tibial vein 16.1 → Interosseous membrane leg 23 → tibialis posterior 25.1 → soleus 52.9
- 방향 보정 시 (21° 편차): tibialis anterior 1.8 → Interosseous membrane leg 29 → tibialis posterior 33.2 → flexor hallucis longus 37.1 → fibula 39.4
- 빈 구간: 42→53mm(soleus 앞)
- 근접 미표시: anterior tibial artery 2.5mm옆@10.7

판정:

### ST39 [종아리] 🟡 보통
- 원문: 直刺 0.5～1寸 (모델 상한 23.8 mm)
- 현재 경로: tibialis anterior 1.7 → anterior tibial vein 14.3 → Interosseous membrane leg 22.2 → tibialis posterior 25.7 → soleus 49.8 → Medial head gastrocnemius 75.7
- 빈 구간: 37→50mm(soleus 앞)
- 근접 미표시: anterior tibial artery 4.1mm옆@8.9; Deep fibular nerve 3.3mm옆@22.1

판정:

## ⚪ 경미 (5혈)

### SI17 [목·어깨윗부분] ⚪ 경미
- 원문: 直刺 0.3～0.5寸 (모델 상한 9.1 mm)
- 기대 층: 흉쇄유돌근 앞 → 두힘살근 뒤힘살 → 속목동맥
- 문제: 속목동맥 2.8 mm 옆 @26 mm → 문헌과 일치하나 교차가 아니라 화면에 안 나옴. 두힘살근 누락
- 현재 경로: sternocleidomastoid 10 → middle pharyngeal constrictor 43.8 → Tongue 52.4 → genioglossus 66.2 → submandibular gland 87.8 → Gingiva of lower jaw 89.4
- 빈 구간: 0→10mm(sternocleidomastoid 앞); 27→44mm(middle pharyngeal constrictor 앞)
- 근접 미표시: internal carotid artery 2.8mm옆@26; stylopharyngeus 3.7mm옆@46.3
- 근거: Chou 2015 BMJ Open MRI https://doi.org/10.1136/bmjopen-2015-007819: 24 mm (일치)
- 제안: 근접 표시만
- 이전 txt 판정: 반려: 깨물근이 뼈에 비해 너무 긴 문제를 해결하고 다시 랜더링한다. 흉쇄유돌근 타겟팅으로 현재 위치가 시각상 보여서, 이를 해결하라.

판정: 

### TE15 [목·어깨윗부분] ⚪ 경미
- 원문: 直刺 0.3～0.5寸 (肩胛棘의 방향으로 偏向하여 刺入, 不宜深刺) (모델 상한 10.1 mm)
- 기대 층: 등세모근 → 어깨올림근 → 견갑골 위각
- 문제: 층 타당. 등쪽어깨동맥 0.9 mm 근접 미표시
- 현재 경로: Transverse part trapezius 12.2 → Ascending part trapezius 13 → levator scapulae 35.9 → scapula 36.6
- 방향 보정 시 (17° 편차): Transverse part trapezius 12.4 → dorsal scapular artery 38.6 → scapula 38.7
- 빈 구간: 0→12mm(Transverse part trapezius 앞); 22→36mm(levator scapulae 앞)
- 근접 미표시: dorsal scapular artery 0.9mm옆@37.3
- 근거: 해부
- 제안: 근접 표시

판정:

### ST17 [가슴] ⚪ 경미
- 원문: 직자 없음
- 기대 층: —
- 문제: 원문 禁鍼으로 시뮬레이션이 잠긴 혈. 경로 검수 대상 아님
- 현재 경로: Sternocostal part pectoralis major 2.3 → internal intercostal muscle 28.4 → Pleura 37.8
- 방향 보정 시 (30° 편차): Sternocostal part pectoralis major 2.5 → fifth rib 39.2
- 근접 미표시: Lateral pectoral nerve 3mm옆@3.6
- 근거: KCMRIC 원문
- 제안: —

판정:

### LI16 [어깨·견갑] ⚪ 경미
- 원문: 直刺 0.3～0.7寸 (모델 상한 14.2 mm)
- 기대 층: 등세모근 → 가시위근 → 견갑골(어깨위혈관)
- 문제: 층 타당. 등세모근~가시위근 10 mm 공백
- 현재 경로: Transverse part trapezius 4.2 → supraspinatus 18.1 → scapula 37.2
- 방향 보정 시 (31° 편차): Transverse part trapezius 4.6 → supraspinatus 21.9 → scapula 51.3
- 빈 구간: 8→18mm(supraspinatus 앞)
- 근거: 해부
- 제안: —

판정:

### SI13 [어깨·견갑] ⚪ 경미
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 기대 층: 등세모근 → 가시위근 → 견갑골
- 문제: 가시위근 두께 1 mm로 비현실적
- 현재 경로: Ascending part trapezius 12.9 → supraspinatus 37.5 → scapula 37.8
- 방향 보정 시 (21° 편차): Ascending part trapezius 13.1 → supraspinatus 35.5 → scapula 35.6
- 빈 구간: 0→13mm(Ascending part trapezius 앞); 24→38mm(supraspinatus 앞)
- 근접 미표시: dorsal scapular artery 2.8mm옆@39.5
- 근거: 해부
- 제안: —
- 이전 txt 판정: 승인

판정: 

## 🟢 양호 (15혈)

### LU1 [가슴] 🟢 양호
- 원문: 直刺 0.3～0.5寸 (모델 상한 8.5 mm)
- 기대 층: 큰가슴근 → 작은가슴근 → 늑간 3층 → 흉막
- 문제: 층 순서 정상, 흉막 55 mm
- 현재 경로: Sternocostal part pectoralis major 10.6 → pectoralis minor 32.4 → external intercostal muscle 45.8 → internal intercostal muscle 46.8 → innermost intercostal muscle 47.4 → Posterior intercostal arteries 47.8 → Intercostal nerves 53.2 → Pleura 55.2
- 빈 구간: 0→11mm(Sternocostal part pectoralis major 앞)
- 근접 미표시: Lateral pectoral nerve 1.1mm옆@12.9; Medial pectoral nerve 3.2mm옆@34.6; anterior intercostal veins 2.1mm옆@46.8
- 근거: 해부
- 제안: —
- 이전 txt 판정: 반려: 자침 가이드에 세모가슴삼각(뭔지 찾아보고, 로컬 파일에 있는 사진 필요시 제공함.)을 그려둬라.

판정: 

### SP18 [가슴] 🟢 양호
- 원문: 直刺 0.2～0.3寸 (不宜深刺) (모델 상한 5.1 mm)
- 현재 경로: Sternocostal part pectoralis major 6.7 → pectoralis minor 36.8 → external intercostal muscle 39.5 → internal intercostal muscle 42.6 → innermost intercostal muscle 44.4 → Pleura 49.4
- 이전 txt 판정: 반려: 동일하게 유두~ 겨드랑이선 중점이어야 하는데, 이에 맞지 않다. 늑간 사이는 맞은듯.

판정: 

### BL26 [등·허리] 🟢 양호
- 원문: 直刺 0.5～1寸 (모델 상한 20.2 mm)
- 현재 경로: latissimus dorsi 5.2 → iliocostalis lumborum 13.8 → quadratus lumborum 28.5 → Sacrum 46.2

판정:

### BL49 [등·허리] 🟢 양호
- 원문: 直刺 0.3～0.5寸 (모델 상한 10.1 mm)
- 현재 경로: latissimus dorsi 5.6 → serratus posterior inferior 12.7 → iliocostalis lumborum 16.3 → eleventh rib 27

판정:

### BL53 [엉치·볼기] 🟢 양호
- 원문: 直刺 0.5～1.5寸 (모델 상한 30.3 mm)
- 기대 층: 큰볼기근 → 궁둥구멍근 → 궁둥신경
- 문제: 궁둥신경 69 mm 교차 — 해부 타당
- 현재 경로: gluteus maximus 17.7 → piriformis 62.4 → Sciatic nerve 69.3
- 빈 구간: 0→18mm(gluteus maximus 앞); 38→62mm(piriformis 앞)
- 근거: 해부
- 제안: —

판정:

### CV12 [배·샅] 🟢 양호
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 기대 층: 백색선 → 복막 → 위/간
- 문제: 위 27 mm
- 현재 경로: Linea alba 13.7 → Stomach 27
- 빈 구간: 0→14mm(Linea alba 앞); 16→27mm(Stomach 앞)
- 근거: Chu 2022 초음파 https://doi.org/10.3390/healthcare10091707: 25.3±10.2 mm (일치)
- 제안: 복막 표시만

판정:

### ST20 [배·샅] 🟢 양호
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 6.5 → internal oblique 7.6 → rectus abdominis 8.7 → internal oblique 22.8 → transversus abdominis 22.9 → Hepatovenous segment IV 26.3

판정:

### ST21 [배·샅] 🟢 양호
- 원문: 直刺 0.5～1寸 (모델 상한 29.7 mm)
- 현재 경로: external oblique 7.4 → internal oblique 8.7 → rectus abdominis 10 → internal oblique 24 → transversus abdominis 24.6 → Hepatovenous segment IV 28.5

판정:

### TE13 [어깨·견갑] 🟢 양호
- 원문: 直刺 0.5～1寸 (모델 상한 20 mm)
- 현재 경로: Spinal part deltoid 8.6 → Lateral head triceps brachii 43 → humerus 60.3

판정:

### LU3 [위팔·팔꿈치] 🟢 양호
- 원문: 直刺 0.3～0.5寸 (모델 상한 10 mm)
- 현재 경로: Long head biceps brachii 7.9 → brachialis 32.8 → Musculocutaneous nerve 33.8 → humerus 42.5
- 방향 보정 시 (23° 편차): Long head biceps brachii 8.6 → brachialis 40.4 → Medial head triceps brachii 62.2

판정:

### PC2 [위팔·팔꿈치] 🟢 양호
- 원문: 直刺 0.3～0.5寸 (모델 상한 10 mm)
- 현재 경로: Long head biceps brachii 7.1 → brachialis 30.4 → humerus 33.7
- 방향 보정 시 (21° 편차): Long head biceps brachii 8.2 → cephalic vein 35 → Acromial part deltoid 40.2 → Spinal part deltoid 48.7

판정:

### SP10 [넓적다리] 🟢 양호
- 원문: 0.5～0.8寸 直刺 (모델 상한 17.8 mm)
- 현재 경로: vastus medialis 2.2 → femur 33
- 방향 보정 시 (15° 편차): vastus medialis 2.4 → femur 35

판정:

### ST33 [넓적다리] 🟢 양호
- 원문: 直刺 0.5～0.7寸 (모델 상한 15.6 mm)
- 현재 경로: rectus femoris 8.3 → vastus intermedius 14.1 → femur 40.4

판정:

### GB37 [종아리] 🟢 양호
- 원문: 0.5～0.9寸 直刺 (모델 상한 21.4 mm)
- 현재 경로: extensor digitorum longus 6.4 → Superficial fibular nerve 10.5 → fibula 13.5

판정:

### GB39 [종아리] 🟢 양호
- 원문: 直刺 0.3～0.5寸 (모델 상한 11.9 mm)
- 현재 경로: fibula 4.7

판정:
