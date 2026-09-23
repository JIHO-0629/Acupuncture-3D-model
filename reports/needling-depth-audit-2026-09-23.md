# 자침 깊이·조기 정지 전수 검사

- 원본: [경혈_데이터_405_WHO_해부학검수.xlsm](https://drive.google.com/file/d/1SkFk0rVxpHHMo2ID1oTLy1yjKvAgl-YD/view) (`자침법`, `모델경로`), 수정하지 않음. 확인한 Drive 수정 시각: 2026-09-23 01:59 UTC.
- 비교 대상: 현재 앱 `data/needling-direct.json`, `app/gb-points.ts`, `app/scene.tsx`.
- 해석 주의: 현재 atlas 메시와 앱의 5개 샤프트 광선으로 재계산한 값입니다. 브라우저와 동일한 참조 모델의 예상 정지값이지만 개인별 조직 위치·안전심도를 뜻하지 않습니다. 혈관·신경 개인차를 정량 판정하지 않습니다.
- 원본 깊이는 비율로 환산한 모델 mm이며 임상 안전심도가 아닙니다. 위험 구조는 통과 허용으로 바꾸지 않았습니다.

- 혈관·신경 조기정지는 **이 참조 모델의 메시 교차** 판정입니다. 개인차 자체를 증명하거나 안전하게 통과할 수 있음을 뜻하지 않습니다. 비담경의 '불일치 0'은 원본 촌·환산 mm 값의 일치만 확인한 것이며, 그 비율과 해부 구조의 임상적 타당성은 별도 검증 대상입니다.

## 집계

- 원본 전체 혈자리: 361개. 직자 기법 기록: 355개, 직자 기법 없음: 6개. 앱 직자 시뮬레이션 활성: 354개, 잠금: 7개.
- 비담경 앱-원본 촌·모델 mm 불일치: 0개.
- 원본 모델 mm의 **비율 환산 참조 구간**이 혈자리 부위와 명백히 다른 검토 후보: 49개. 원본 생성기 `raycast_all.mjs`의 구간 선택을 점검한 것으로, mm 오차량이나 임상적으로 잘못된 깊이를 확정한 값은 아닙니다.
- 비담경 원본 상한 전 조기 정지: 109개. 이 중 혈관·신경: 40개, 기타: 69개.
- 원본 깊이 안에 있는 근육이 앱 정지상한 때문에 미표시: 34개(담경 포함).
- 원본 깊이 안 근육 교차 없음: 166개; 구조물 교차 전혀 없음: 101개. 이는 깊이 오류의 확증이 아니라 좌표·방향·메시 재검토 대상입니다.
- 담경 고정 탐색 길이(문헌 촌 깊이 미반영): 44개.

- 담경 앱 정지상한이 원본 환산 상한 초과: 22개; 미달: 22개; 같음: 0개. 초과는 문헌 범위를 넘어 모델 바늘이 진행될 수 있다는 뜻입니다.
- 현행 메시에서 피부 투영 실패: 0개.
- 비담경 조기정지 메시 종류: arterial 11, digestive 11, nervous 2, sensory 3, skeletal 55, venous 27.
- 근육 미표시의 첫 정지 메시 종류: arterial 4, digestive 3, nervous 2, none 2, sensory 1, skeletal 7, venous 15.

## 조기 정지로 원본 범위 내 근육이 가려진 혈자리

LU6, LI6, ST20, ST21, ST26, ST28, ST29, ST37, SP3, HT5, HT8, SI1, SI2, SI3, SI6, SI19, BL31, KI7, KI14, KI16, KI17, KI18, KI21, PC8, TE2, GB37, GB38, GB40, GB41, GB44, CV15, CV22, GV6, GV7

## 비율 환산 구간 검토 후보

LU3 (upper-arm-R → 전완 12 B-cun), LU4 (upper-arm-R → 전완 12 B-cun), LU5 (upper-arm-R → 전완 12 B-cun), LU9 (hand-R → 전완 12 B-cun), LU10 (hand-R → 전완 12 B-cun), LU11 (hand-R → 전완 12 B-cun), LI1 (index finger · distal radial aspect → 전완 12 B-cun), LI2 (index finger · radial aspect of MCP2 → 전완 12 B-cun), LI4 (dorsum of hand → 전완 12 B-cun), LI15 (shoulder girdle → 전완 12 B-cun), LI16 (shoulder girdle · suprascapular fossa lateral → 전완 12 B-cun), LI17 (anterior neck · posterior to SCM border → 흉부 9 B-cun), LI18 (anterior neck · within SCM borders → 흉부 9 B-cun), ST4 (face → 흉부 9 B-cun), ST5 (face → 흉부 9 B-cun), ST9 (neck → 흉부 9 B-cun), ST10 (neck → 흉부 9 B-cun), HT1 (upper-arm-R → 전완 12 B-cun), HT3 (upper-arm-R → 전완 12 B-cun), HT7 (hand-R → 전완 12 B-cun), HT8 (hand-R → 전완 12 B-cun), HT9 (hand-R → 전완 12 B-cun), SI1 (hand-R → 전완 12 B-cun), SI2 (hand-R → 전완 12 B-cun), SI3 (hand-R → 전완 12 B-cun), SI4 (hand-R → 전완 12 B-cun), SI5 (hand-R → 전완 12 B-cun), SI9 (shoulder → 전완 12 B-cun), SI10 (shoulder → 전완 12 B-cun), SI16 (neck → 흉부 9 B-cun), SI17 (face → 흉부 9 B-cun), BL10 (neck → 흉부 9 B-cun), PC2 (upper-arm-R → 전완 12 B-cun), PC3 (upper-arm-R → 전완 12 B-cun), PC7 (hand-R → 전완 12 B-cun), PC8 (hand-R → 전완 12 B-cun), PC9 (hand-R → 전완 12 B-cun), TE1 (hand-R → 전완 12 B-cun), TE2 (hand-R → 전완 12 B-cun), TE3 (hand-R → 전완 12 B-cun), TE10 (upper-arm-R → 전완 12 B-cun), TE11 (upper-arm-R → 전완 12 B-cun), TE12 (upper-arm-R → 전완 12 B-cun), TE13 (upper-arm-R → 전완 12 B-cun), TE14 (shoulder → 전완 12 B-cun), TE16 (neck → 흉부 9 B-cun), CV23 (face → 흉부 9 B-cun), CV24 (face → 흉부 9 B-cun), GV15 (neck → 흉부 9 B-cun)

## 혈관·신경 메시 때문에 원본 상한 전에 정지한 혈자리

LU6 (Right cephalic vein @4.3mm → 정지 3.9mm), LU8 (Right radial artery @3.8mm → 정지 3.4mm), LI2 (Right arteria radialis indicis @5.3mm → 정지 4.8mm), LI6 (Right cephalic vein @8.3mm → 정지 7.5mm), ST19 (Hepatovenous segment IV @19.1mm → 정지 17.2mm), ST20 (Hepatovenous segment IV @19.5mm → 정지 17.6mm), ST21 (Hepatovenous segment IV @27.2mm → 정지 24.5mm), ST26 (Right superficial epigastric vein @0.1mm → 정지 0.1mm), ST28 (Right superficial epigastric vein @0.5mm → 정지 0.5mm), ST29 (Right superior epigastric vein @5.1mm → 정지 4.6mm), ST37 (Right anterior tibial vein @19.9mm → 정지 17.9mm), ST38 (Right anterior tibial vein @15.3mm → 정지 13.8mm), ST39 (Right anterior tibial vein @13.8mm → 정지 12.4mm), ST41 (Right dorsalis pedis artery @12.1mm → 정지 10.9mm), SP2 (Set of plantar digital veins @0.0mm → 정지 0.0mm), SP3 (Set of plantar digital veins @0.2mm → 정지 0.2mm), HT5 (Right ulnar vein @2.2mm → 정지 2.0mm), HT7 (Right ulnar artery @7.9mm → 정지 7.1mm), HT8 (Proper palmar digital vein of right little finger @5.3mm → 정지 4.8mm), SI2 (Right fourth common palmar digital artery @1.9mm → 정지 1.7mm), SI3 (Proper palmar digital vein of right little finger @1.7mm → 정지 1.5mm), SI5 (Right basilic vein @0.2mm → 정지 0.2mm), BL2 (Right supratrochlear nerve @3.7mm → 정지 3.3mm), BL57 (Right fibular vein @31.9mm → 정지 28.7mm), BL67 (Set of dorsal digital veins @3.2mm → 정지 2.9mm), KI3 (Right posterior tibial vein @8.5mm → 정지 7.7mm), KI5 (Right posterior tibial vein @1.4mm → 정지 1.3mm), KI7 (Right posterior tibial vein @0.0mm → 정지 0.0mm), KI9 (Right posterior tibial artery @18.7mm → 정지 16.8mm), KI18 (Right superior epigastric artery @20.9mm → 정지 18.8mm), KI20 (Hepatovenous segment IV @18.4mm → 정지 16.6mm), KI21 (Right superior epigastric artery @12.8mm → 정지 11.5mm), PC5 (Right Median nerve @12.6mm → 정지 11.3mm), PC8 (Proper palmar digital vein of right little finger @6.6mm → 정지 5.9mm), TE1 (Set of dorsal digital arteries @2.1mm → 정지 1.9mm), TE2 (Set of dorsal digital arteries @4.1mm → 정지 3.7mm), TE3 (Set of dorsal metacarpal arteries @3.9mm → 정지 3.5mm), LR2 (Dorsal metacarpal vein @8.0mm → 정지 7.2mm), LR3 (Dorsal venous arch of right foot @2.4mm → 정지 2.2mm), CV13 (Hepatovenous segment III @18.6mm → 정지 16.7mm)

## 기타 메시 때문에 원본 상한 전에 정지한 혈자리

LU10 (Right first metacarpal bone @10.9mm → 정지 9.8mm), LI1 (Distal phalanx of right index finger @3.1mm → 정지 2.8mm), LI10 (Right radius @24.5mm → 정지 22.1mm), LI11 (Right humerus @32.5mm → 정지 29.3mm), LI15 (Right humerus @8.3mm → 정지 7.5mm), ST6 (Right zygomatic bone @5.5mm → 정지 5.0mm), ST8 (Frontal bone @5.0mm → 정지 4.5mm), ST11 (Right clavicle @7.8mm → 정지 7.0mm), ST23 (Transverse colon @22.5mm → 정지 20.3mm), ST27 (Middle part of ileum @21.2mm → 정지 19.1mm), ST44 (Proximal phalanx of right second toe @6.2mm → 정지 5.6mm), SP1 (Distal phalanx of right big toe @4.7mm → 정지 4.2mm), SP4 (Right first metatarsal bone @21.6mm → 정지 19.4mm), SP9 (Right tibia @8.7mm → 정지 7.8mm), HT4 (Right ulna @11.1mm → 정지 10.0mm), HT6 (Right ulna @8.8mm → 정지 7.9mm), HT9 (Distal phalanx of right little finger @0.8mm → 정지 0.7mm), SI1 (Middle phalanx of right little finger @0.0mm → 정지 0.0mm), SI6 (Right ulna @5.1mm → 정지 4.6mm), SI19 (External ear @1.0mm → 정지 0.9mm), BL1 (Right maxilla @2.9mm → 정지 2.6mm), BL3 (Frontal bone @4.0mm → 정지 3.6mm), BL4 (Frontal bone @3.8mm → 정지 3.4mm), BL5 (Frontal bone @4.7mm → 정지 4.2mm), BL7 (Right parietal bone @4.5mm → 정지 4.1mm), BL8 (Right parietal bone @2.4mm → 정지 2.2mm), BL9 (Occipital bone @5.0mm → 정지 4.5mm), BL31 (Sacrum @33.4mm → 정지 30.1mm), BL63 (Right fourth metatarsal bone @12.5mm → 정지 11.3mm), BL65 (Proximal phalanx of right little toe @6.4mm → 정지 5.8mm), BL66 (Proximal phalanx of right little toe @5.8mm → 정지 5.2mm), KI6 (Right talus @11.0mm → 정지 9.9mm), KI14 (Proximal part of ileum @23.3mm → 정지 21.0mm), KI16 (Distal part of jejunum @18.9mm → 정지 17.0mm), KI17 (Transverse colon @14.0mm → 정지 12.6mm), TE17 (External ear @0.0mm → 정지 0.0mm), TE18 (External ear @0.0mm → 정지 0.0mm), TE19 (Right temporal bone @1.9mm → 정지 1.7mm), TE20 (Right parietal bone @0.9mm → 정지 0.8mm), TE21 (Right temporal bone @5.6mm → 정지 5.0mm), TE23 (Frontal bone @3.4mm → 정지 3.1mm), LR5 (Right tibia @8.1mm → 정지 7.3mm), LR6 (Right tibia @7.1mm → 정지 6.4mm), CV5 (Proximal part of ileum @24.4mm → 정지 22.0mm), CV6 (Proximal part of ileum @21.8mm → 정지 19.6mm), CV7 (Distal part of jejunum @19.8mm → 정지 17.8mm), CV9 (Distal part of jejunum @25.6mm → 정지 23.0mm), CV10 (Transverse colon @12.0mm → 정지 10.8mm), CV12 (Stomach @25.7mm → 정지 23.1mm), CV15 (Xiphoid process @2.4mm → 정지 2.2mm), CV16 (Body of sternum @0.0mm → 정지 0.0mm), CV17 (Body of sternum @3.6mm → 정지 3.2mm), CV18 (Body of sternum @2.2mm → 정지 2.0mm), CV19 (Body of sternum @3.1mm → 정지 2.8mm), CV20 (Manubrium @2.3mm → 정지 2.1mm), CV21 (Manubrium @1.8mm → 정지 1.6mm), CV22 (Manubrium @3.7mm → 정지 3.3mm), GV6 (Eleventh thoracic vertebra @11.0mm → 정지 9.9mm), GV7 (Tenth thoracic vertebra @7.7mm → 정지 6.9mm), GV8 (Ninth thoracic vertebra @9.8mm → 정지 8.8mm), GV16 (Occipital bone @4.2mm → 정지 3.8mm), GV17 (Occipital bone @2.5mm → 정지 2.3mm), GV18 (Occipital bone @4.7mm → 정지 4.2mm), GV19 (Right parietal bone @4.6mm → 정지 4.1mm), GV20 (Left parietal bone @1.6mm → 정지 1.4mm), GV21 (Left parietal bone @3.0mm → 정지 2.7mm), GV23 (Frontal bone @3.6mm → 정지 3.2mm), GV24 (Frontal bone @3.4mm → 정지 3.1mm), GV28 (Gingiva of upper jaw @0.1mm → 정지 0.1mm)

## 담경 원본 상한 초과 혈자리

GB3 (+19.9mm), GB4 (+4.7mm), GB5 (+2.0mm), GB6 (+1.7mm), GB12 (+2.2mm), GB13 (+0.5mm), GB16 (+0.6mm), GB17 (+0.8mm), GB19 (+1.8mm), GB21 (+15.4mm), GB22 (+32.4mm), GB23 (+27.0mm), GB24 (+15.1mm), GB25 (+20.2mm), GB27 (+41.5mm), GB28 (+47.0mm), GB29 (+25.9mm), GB30 (+62.2mm), GB31 (+56.6mm), GB32 (+19.2mm), GB33 (+7.1mm), GB43 (+2.2mm)

## 담경 원본 상한 미달 혈자리

GB1 (-0.5mm), GB2 (-5.7mm), GB7 (-0.8mm), GB8 (-2.7mm), GB9 (-2.8mm), GB10 (-1.3mm), GB11 (-0.4mm), GB14 (-0.9mm), GB15 (-0.4mm), GB18 (-1.8mm), GB20 (-8.0mm), GB26 (-11.5mm), GB34 (-2.8mm), GB35 (-3.9mm), GB36 (-4.0mm), GB37 (-12.0mm), GB38 (-8.6mm), GB39 (-7.9mm), GB40 (-1.1mm), GB41 (-12.0mm), GB42 (-0.7mm), GB44 (-2.1mm)

## 전 혈자리 상세

`앱 상한(mm)`는 현행 모델 메시 경로에 앱의 정지 규칙을 적용한 값입니다. `앱-원본(mm)`이 양수면 문헌 상한 초과입니다. `상한 내 첫 근육`은 원본 깊이까지 보면 메시가 교차하는 첫 근육입니다. `미표시`는 그 근육이 앱 정지 상한 뒤에 있음을 뜻합니다.

| 혈자리 | 원본 기법 | 원본 직자 | 원본 환산상한 mm | 앱 설정탐색 mm | 앱 상한 mm | 앱-원본 mm | 분류 | 첫 위험 메시 @mm | 상한 내 첫 근육 @mm | 근육 미표시 |
|---|---|---:|---:|---:|---:|---:|---|---|---|---|
| LU1 | LU1-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| LU2 | LU2-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| LU3 | LU3-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | Long head of right biceps brachii @7.7 | — |
| LU4 | LU4-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| LU5 | LU5-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| LU6 | LU6-A | 0.5–1촌 | 22.2 | 22.2 | 3.9 | -18.3 | 혈관·신경 메시 조기정지 | Right cephalic vein (venous) @4.3 | Right brachioradialis @5.5 | Right brachioradialis @5.5, Humeral head of right pronator teres @15.0, Ulnar head of right pronator teres @18.6 |
| LU7 | LU7-A | 0.2–0.3촌 | 6.7 | 6.7 | 6.7 | +0.0 | 원본 깊이 상한 | — | — | — |
| LU8 | LU8-A | 0.2–0.3촌 | 6.7 | 6.7 | 3.4 | -3.3 | 혈관·신경 메시 조기정지 | Right radial artery (arterial) @3.8 | — | — |
| LU9 | LU9-A | 0.2–0.3촌 | 6.7 | 6.7 | 6.7 | +0.0 | 원본 깊이 상한 | — | — | — |
| LU10 | LU10-A | 0.3–0.5촌 | 11.1 | 11.1 | 9.8 | -1.3 | 뼈·장기 등 메시 조기정지 | Right first metacarpal bone (skeletal) @10.9 | — | — |
| LU11 | LU11-A | 0.1–0.2촌 | 4.4 | 4.4 | 4.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| LI1 | LI1-A | 0.1–0.2촌 | 4.4 | 4.4 | 2.8 | -1.6 | 뼈·장기 등 메시 조기정지 | Distal phalanx of right index finger (skeletal) @3.1 | — | — |
| LI2 | LI2-A | 0.2–0.3촌 | 6.7 | 6.7 | 4.8 | -1.9 | 혈관·신경 메시 조기정지 | Right arteria radialis indicis (arterial) @5.3 | — | — |
| LI3 | — | 원본 범위 없음 | — | — | — | — | 원본 직자 기법 없음 | — | — | — |
| LI4 | LI4-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Transverse head of right adductor pollicis @10.8 | — |
| LI5 | LI5-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| LI6 | LI6-A | 0.3–0.5촌 | 11.1 | 11.1 | 7.5 | -3.6 | 혈관·신경 메시 조기정지 | Right cephalic vein (venous) @8.3 | Right extensor carpi radialis longus @10.2 | Right extensor carpi radialis longus @10.2, Right brachioradialis @10.8 |
| LI7 | LI7-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Right brachioradialis @6.6 | — |
| LI8 | LI8-A | 0.5–0.8촌 | 17.8 | 17.8 | 17.8 | +0.0 | 원본 깊이 상한 | — | Right brachioradialis @6.1 | — |
| LI9 | LI9-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Right brachioradialis @3.2 | — |
| LI10 | LI10-A | 0.5–1.2촌 | 26.7 | 26.7 | 22.1 | -4.6 | 뼈·장기 등 메시 조기정지 | Right radius (skeletal) @24.5 | Right brachioradialis @3.1 | — |
| LI11 | LI11-A | 0.5–1.5촌 | 33.3 | 33.3 | 29.3 | -4.0 | 뼈·장기 등 메시 조기정지 | Right humerus (skeletal) @32.5 | Right brachioradialis @11.2 | — |
| LI12 | LI12-A | 0.3–0.7촌 | 15.6 | 15.6 | 15.6 | +0.0 | 원본 깊이 상한 | — | — | — |
| LI13 | LI13-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| LI14 | LI14-A | 0.3–0.7촌 | 15.6 | 15.6 | 15.6 | +0.0 | 원본 깊이 상한 | — | — | — |
| LI15 | LI15-A | 0.5–1.2촌 | 26.7 | 26.7 | 7.5 | -19.2 | 뼈·장기 등 메시 조기정지 | Right humerus (skeletal) @8.3 | Acromial part of right deltoid @0.1 | — |
| LI16 | LI16-A | 0.3–0.7촌 | 15.6 | 15.6 | 15.6 | +0.0 | 원본 깊이 상한 | — | Transverse part of right trapezius @8.5 | — |
| LI17 | LI17-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| LI18 | LI18-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | Right sternocleidomastoid @8.0 | — |
| LI19 | LI19-A | 0.2–0.3촌 | 5.4 | 5.4 | 5.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| LI20 | LI20-A | 0.2–0.3촌 | 5.4 | 5.4 | 5.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST1 | ST1-A | 0.2–0.3촌 | 5.4 | 5.4 | 5.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST2 | ST2-A | 0.2–0.3촌 | 5.4 | 5.4 | 5.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST3 | ST3-A | 0.3–0.5촌 | 9.0 | 9.0 | 9.0 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST4 | ST4-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | Orbicularis oris @7.8 | — |
| ST5 | ST5-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | Right platysma @5.1 | — |
| ST6 | ST6-A | 0.3–0.5촌 | 9.0 | 9.0 | 5.0 | -4.0 | 뼈·장기 등 메시 조기정지 | Right zygomatic bone (skeletal) @5.5 | Right zygomaticus major @4.4 | — |
| ST7 | — | 원본 범위 없음 | — | — | — | — | 원본 직자 기법 없음 | — | — | — |
| ST8 | ST8-A | 0.2–0.3촌 | 5.4 | 5.4 | 4.5 | -0.9 | 뼈·장기 등 메시 조기정지 | Frontal bone (skeletal) @5.0 | — | — |
| ST9 | ST9-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | Right platysma @2.4 | — |
| ST10 | ST10-B | 0.3–0.4촌 | 6.8 | 6.8 | 6.8 | +0.0 | 원본 깊이 상한 | — | Right platysma @2.8 | — |
| ST11 | ST11-A | 0.3–0.5촌 | 8.5 | 8.5 | 7.0 | -1.5 | 뼈·장기 등 메시 조기정지 | Right clavicle (skeletal) @7.8 | Right platysma @0.2 | — |
| ST12 | ST12-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST13 | ST13-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST14 | ST14-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST15 | ST15-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST16 | ST16-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | Sternocostal part of right pectoralis major @3.4 | — |
| ST17 | — | 원본 범위 없음 | — | — | — | — | 원본 직자 기법 없음 | — | — | — |
| ST18 | ST18-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | Sternocostal part of right pectoralis major @0.0 | — |
| ST19 | ST19-A | 0.5–0.8촌 | 23.8 | 23.8 | 17.2 | -6.6 | 혈관·신경 메시 조기정지 | Hepatovenous segment IV (venous) @19.1 | Right external oblique @0.6 | — |
| ST20 | ST20-A | 0.5–1촌 | 29.7 | 29.7 | 17.6 | -12.1 | 혈관·신경 메시 조기정지 | Hepatovenous segment IV (venous) @19.5 | Right external oblique @0.1 | Right transversus abdominis @29.5 |
| ST21 | ST21-A | 0.5–1촌 | 29.7 | 29.7 | 24.5 | -5.2 | 혈관·신경 메시 조기정지 | Hepatovenous segment IV (venous) @27.2 | Right external oblique @0.0 | Right transversus abdominis @28.9 |
| ST22 | ST22-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right external oblique @0.0 | — |
| ST23 | ST23-A | 0.5–1촌 | 29.7 | 29.7 | 20.3 | -9.4 | 뼈·장기 등 메시 조기정지 | Transverse colon (digestive) @22.5 | Right external oblique @2.8 | — |
| ST24 | ST24-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right external oblique @4.5 | — |
| ST25 | ST25-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right external oblique @3.8 | — |
| ST26 | ST26-A | 0.5–1촌 | 29.7 | 29.7 | 0.1 | -29.6 | 혈관·신경 메시 조기정지 | Right superficial epigastric vein (venous) @0.1 | Right external oblique @0.0 | Right internal oblique @5.2, Right rectus abdominis @17.3 |
| ST27 | ST27-A | 0.5–1촌 | 29.7 | 29.7 | 19.1 | -10.6 | 뼈·장기 등 메시 조기정지 | Middle part of ileum (digestive) @21.2 | Right external oblique @0.0 | — |
| ST28 | ST28-A | 0.5–1촌 | 29.7 | 29.7 | 0.5 | -29.2 | 혈관·신경 메시 조기정지 | Right superficial epigastric vein (venous) @0.5 | Right internal oblique @0.0 | Right external oblique @2.3, Right rectus abdominis @21.9, Right transversus abdominis @25.6 |
| ST29 | ST29-A | 0.5–1촌 | 29.7 | 29.7 | 4.6 | -25.1 | 혈관·신경 메시 조기정지 | Right superior epigastric vein (venous) @5.1 | Right internal oblique @4.8 | Right internal oblique @4.8, Right transversus abdominis @6.5, Right external oblique @7.8 |
| ST30 | ST30-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | Right internal oblique @8.3 | — |
| ST31 | ST31-A | 0.8–1.5촌 | 33.4 | 33.4 | 33.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST32 | ST32-A | 0.5–1촌 | 22.3 | 22.3 | 22.3 | +0.0 | 원본 깊이 상한 | — | Right rectus femoris @10.5 | — |
| ST33 | ST33-A | 0.5–0.7촌 | 15.6 | 15.6 | 15.6 | +0.0 | 원본 깊이 상한 | — | Right rectus femoris @8.1 | — |
| ST34 | ST34-A | 0.5–1촌 | 22.3 | 22.3 | 22.3 | +0.0 | 원본 깊이 상한 | — | Right rectus femoris @11.9 | — |
| ST35 | ST35-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST36 | ST36-A | 0.5–1.5촌 | 35.7 | 35.7 | 35.7 | +0.0 | 원본 깊이 상한 | — | Right tibialis anterior @8.5 | — |
| ST37 | ST37-A | 0.5–1.5촌 | 35.7 | 35.7 | 17.9 | -17.8 | 혈관·신경 메시 조기정지 | Right anterior tibial vein (venous) @19.9 | Right tibialis anterior @4.2 | Right tibialis posterior @30.9 |
| ST38 | ST38-A | 0.5–1촌 | 23.8 | 23.8 | 13.8 | -10.0 | 혈관·신경 메시 조기정지 | Right anterior tibial vein (venous) @15.3 | Right tibialis anterior @1.5 | — |
| ST39 | ST39-A | 0.5–1촌 | 23.8 | 23.8 | 12.4 | -11.4 | 혈관·신경 메시 조기정지 | Right anterior tibial vein (venous) @13.8 | Right tibialis anterior @1.5 | — |
| ST40 | ST40-A | 0.5–1촌 | 23.8 | 23.8 | 23.8 | +0.0 | 원본 깊이 상한 | — | Right tibialis anterior @6.0 | — |
| ST41 | ST41-A | 0.3–0.8촌 | 19.0 | 19.0 | 10.9 | -8.1 | 혈관·신경 메시 조기정지 | Right dorsalis pedis artery (arterial) @12.1 | — | — |
| ST42 | ST42-A | 0.2–0.3촌 | 7.1 | 7.1 | 7.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST43 | ST43-A | 0.3–0.5촌 | 14.3 | 14.3 | 14.3 | +0.0 | 원본 깊이 상한 | — | — | — |
| ST44 | ST44-A | 0.2–0.4촌 | 11.5 | 11.5 | 5.6 | -5.9 | 뼈·장기 등 메시 조기정지 | Proximal phalanx of right second toe (skeletal) @6.2 | — | — |
| ST45 | ST45-A | 0.1–0.2촌 | 5.7 | 5.7 | 5.7 | +0.0 | 원본 깊이 상한 | — | — | — |
| SP1 | SP1-A | 0.1–0.2촌 | 5.7 | 5.7 | 4.2 | -1.5 | 뼈·장기 등 메시 조기정지 | Distal phalanx of right big toe (skeletal) @4.7 | — | — |
| SP2 | SP2-A | 0.2–0.3촌 | 8.6 | 8.6 | 0.0 | -8.6 | 혈관·신경 메시 조기정지 | Set of plantar digital veins (venous) @0.0 | — | — |
| SP3 | SP3-A | 0.3–0.5촌 | 14.3 | 14.3 | 0.2 | -14.1 | 혈관·신경 메시 조기정지 | Set of plantar digital veins (venous) @0.2 | Medial head of right flexor hallucis brevis @5.1 | Medial head of right flexor hallucis brevis @5.1, Right abductor hallucis @5.2 |
| SP4 | SP4-A | 0.5–1촌 | 28.6 | 28.6 | 19.4 | -9.2 | 뼈·장기 등 메시 조기정지 | Right first metatarsal bone (skeletal) @21.6 | Right flexor hallucis longus @12.6 | — |
| SP5 | SP5-A | 0.3–0.5촌 | 11.9 | 11.9 | 11.9 | +0.0 | 원본 깊이 상한 | — | — | — |
| SP6 | SP6-A | 1–1.5촌 | 35.7 | 35.7 | 35.7 | +0.0 | 원본 깊이 상한 | — | Right flexor digitorum longus @5.9 | — |
| SP7 | SP7-A | 0.5–1촌 | 23.8 | 23.8 | 23.8 | +0.0 | 원본 깊이 상한 | — | Right soleus @2.9 | — |
| SP8 | SP8-A | 0.5–1촌 | 23.8 | 23.8 | 23.8 | +0.0 | 원본 깊이 상한 | — | Medial head of right gastrocnemius @6.0 | — |
| SP9 | SP9-A | 0.5–1촌 | 23.8 | 23.8 | 7.8 | -16.0 | 뼈·장기 등 메시 조기정지 | Right tibia (skeletal) @8.7 | Right semimembranosus @4.1 | — |
| SP10 | SP10-A | 0.5–0.8촌 | 17.8 | 17.8 | 17.8 | +0.0 | 원본 깊이 상한 | — | Right vastus medialis @1.8 | — |
| SP11 | SP11-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| SP12 | SP12-A | 0.5–0.7촌 | 15.6 | 15.6 | 15.6 | +0.0 | 원본 깊이 상한 | — | — | — |
| SP13 | SP13-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right internal oblique @9.3 | — |
| SP14 | SP14-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right external oblique @4.1 | — |
| SP15 | SP15-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right external oblique @6.9 | — |
| SP16 | SP16-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right internal oblique @0.2 | — |
| SP17 | SP17-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| SP18 | SP18-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | Sternocostal part of right pectoralis major @4.3 | — |
| SP19 | SP19-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | Sternocostal part of right pectoralis major @5.0 | — |
| SP20 | SP20-A | 0.2–0.4촌 | 6.8 | 6.8 | 6.8 | +0.0 | 원본 깊이 상한 | — | — | — |
| SP21 | SP21-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | Short head of right biceps brachii @0.0 | — |
| HT1 | HT1-A | 0.2–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| HT2 | HT2-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | Short head of right biceps brachii @8.6 | — |
| HT3 | HT3-A | 0.3–0.8촌 | 17.8 | 17.8 | 17.8 | +0.0 | 원본 깊이 상한 | — | Right brachialis @15.8 | — |
| HT4 | HT4-A | 0.2–0.5촌 | 11.1 | 11.1 | 10.0 | -1.1 | 뼈·장기 등 메시 조기정지 | Right ulna (skeletal) @11.1 | Right pronator quadratus @7.0 | — |
| HT5 | HT5-A | 0.3–0.5촌 | 11.1 | 11.1 | 2.0 | -9.1 | 혈관·신경 메시 조기정지 | Right ulnar vein (venous) @2.2 | Right pronator quadratus @6.7 | Right pronator quadratus @6.7 |
| HT6 | HT6-A | 0.3–0.5촌 | 11.1 | 11.1 | 7.9 | -3.2 | 뼈·장기 등 메시 조기정지 | Right ulna (skeletal) @8.8 | — | — |
| HT7 | HT7-A | 0.2–0.5촌 | 11.1 | 11.1 | 7.1 | -4.0 | 혈관·신경 메시 조기정지 | Right ulnar artery (arterial) @7.9 | — | — |
| HT8 | HT8-A | 0.3–0.5촌 | 11.1 | 11.1 | 4.8 | -6.3 | 혈관·신경 메시 조기정지 | Proper palmar digital vein of right little finger (venous) @5.3 | Right palmaris longus @4.1 | Set of lumbricals of right hand @8.9 |
| HT9 | HT9-A | 0.1–0.2촌 | 4.4 | 4.4 | 0.7 | -3.7 | 뼈·장기 등 메시 조기정지 | Distal phalanx of right little finger (skeletal) @0.8 | — | — |
| SI1 | SI1-A | 0.1–0.2촌 | 4.4 | 4.4 | 0.0 | -4.4 | 뼈·장기 등 메시 조기정지 | Middle phalanx of right little finger (skeletal) @0.0 | Right flexor digitorum profundus @3.3 | Right flexor digitorum profundus @3.3 |
| SI2 | SI2-A | 0.2–0.3촌 | 6.7 | 6.7 | 1.7 | -5.0 | 혈관·신경 메시 조기정지 | Right fourth common palmar digital artery (arterial) @1.9 | Abductor digiti minimi of right hand @2.7 | Abductor digiti minimi of right hand @2.7 |
| SI3 | SI3-A | 0.5–1촌 | 22.2 | 22.2 | 1.5 | -20.7 | 혈관·신경 메시 조기정지 | Proper palmar digital vein of right little finger (venous) @1.7 | Right flexor digitorum profundus @9.0 | Right flexor digitorum profundus @9.0, Right flexor digitorum superficialis @9.9, Right palmaris longus @14.6 |
| SI4 | SI4-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | Humeral head of right flexor carpi ulnaris @5.7 | — |
| SI5 | SI5-A | 0.2–0.4촌 | 8.9 | 8.9 | 0.2 | -8.7 | 혈관·신경 메시 조기정지 | Right basilic vein (venous) @0.2 | — | — |
| SI6 | SI6-A | 0.3–0.5촌 | 11.1 | 11.1 | 4.6 | -6.5 | 뼈·장기 등 메시 조기정지 | Right ulna (skeletal) @5.1 | Right extensor carpi ulnaris @8.4 | Right extensor carpi ulnaris @8.4 |
| SI7 | SI7-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | Ulnar head of right flexor carpi ulnaris @9.1 | — |
| SI8 | SI8-A | 0.2–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| SI9 | SI9-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | — | — |
| SI10 | SI10-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | — | — |
| SI11 | SI11-A | 0.5–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| SI12 | SI12-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| SI13 | SI13-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| SI14 | SI14-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| SI15 | SI15-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| SI16 | SI16-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| SI17 | SI17-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | Deep part of right masseter @0.0 | — |
| SI18 | SI18-A | 0.2–0.3촌 | 5.4 | 5.4 | 5.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| SI19 | SI19-A | 0.3–0.5촌 | 9.0 | 9.0 | 0.9 | -8.1 | 뼈·장기 등 메시 조기정지 | External ear (sensory) @1.0 | Right temporalis @3.6 | Right temporalis @3.6 |
| BL1 | BL1-A | 0.1–0.3촌 | 5.4 | 5.4 | 2.6 | -2.8 | 뼈·장기 등 메시 조기정지 | Right maxilla (skeletal) @2.9 | Right nasalis @2.0 | — |
| BL2 | BL2-A | 0.3–0.5촌 | 9.0 | 9.0 | 3.3 | -5.7 | 혈관·신경 메시 조기정지 | Right supratrochlear nerve (nervous) @3.7 | Right procerus @3.0 | — |
| BL3 | BL3-A | 0.2–0.3촌 | 5.4 | 5.4 | 3.6 | -1.8 | 뼈·장기 등 메시 조기정지 | Frontal bone (skeletal) @4.0 | — | — |
| BL4 | BL4-A | 0.2–0.3촌 | 5.4 | 5.4 | 3.4 | -2.0 | 뼈·장기 등 메시 조기정지 | Frontal bone (skeletal) @3.8 | — | — |
| BL5 | BL5-A | 0.2–0.3촌 | 5.4 | 5.4 | 4.2 | -1.2 | 뼈·장기 등 메시 조기정지 | Frontal bone (skeletal) @4.7 | — | — |
| BL6 | BL6-A | 0.2–0.3촌 | 5.4 | 5.4 | 5.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL7 | BL7-A | 0.2–0.3촌 | 5.4 | 5.4 | 4.1 | -1.3 | 뼈·장기 등 메시 조기정지 | Right parietal bone (skeletal) @4.5 | — | — |
| BL8 | BL8-A | 0.2–0.3촌 | 5.4 | 5.4 | 2.2 | -3.2 | 뼈·장기 등 메시 조기정지 | Right parietal bone (skeletal) @2.4 | — | — |
| BL9 | BL9-A | 0.2–0.3촌 | 5.4 | 5.4 | 4.5 | -0.9 | 뼈·장기 등 메시 조기정지 | Occipital bone (skeletal) @5.0 | — | — |
| BL10 | BL10-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL11 | BL11-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL12 | BL12-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL13 | BL13-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL14 | BL14-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL15 | BL15-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL16 | BL16-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL17 | BL17-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | Ascending part of right trapezius @8.2 | — |
| BL18 | BL18-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL19 | BL19-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | Right latissimus dorsi @13.5 | — |
| BL20 | BL20-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | Right latissimus dorsi @11.6 | — |
| BL21 | BL21-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | Right latissimus dorsi @11.3 | — |
| BL22 | BL22-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | Right serratus posterior inferior @13.5 | — |
| BL23 | BL23-A | 0.3–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right latissimus dorsi @15.6 | — |
| BL24 | BL24-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL25 | BL25-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right latissimus dorsi @16.7 | — |
| BL26 | BL26-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right iliocostalis lumborum @13.6 | — |
| BL27 | BL27-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right iliocostalis lumborum @22.0 | — |
| BL28 | BL28-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right gluteus maximus @25.3 | — |
| BL29 | BL29-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right gluteus maximus @26.9 | — |
| BL30 | BL30-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right gluteus maximus @25.3 | — |
| BL31 | BL31-A | 0.5–1.2촌 | 35.7 | 35.7 | 30.1 | -5.6 | 뼈·장기 등 메시 조기정지 | Sacrum (skeletal) @33.4 | Right iliocostalis lumborum @12.3 | Right gluteus maximus @32.6 |
| BL32 | BL32-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right iliocostalis lumborum @14.0 | — |
| BL33 | BL33-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right gluteus maximus @27.8 | — |
| BL34 | BL34-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right gluteus maximus @27.8 | — |
| BL35 | BL35-A | 0.3–0.8촌 | 17.8 | 17.8 | 17.8 | +0.0 | 원본 깊이 상한 | — | Right gluteus maximus @16.2 | — |
| BL36 | BL36-A | 0.5–1.5촌 | 33.4 | 33.4 | 33.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL37 | BL37-A | 0.5–1.5촌 | 33.4 | 33.4 | 33.4 | +0.0 | 원본 깊이 상한 | — | Long head of right biceps femoris @12.3 | — |
| BL38 | BL38-A | 0.5–1촌 | 22.3 | 22.3 | 22.3 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL39 | BL39-A | 0.3–1촌 | 22.3 | 22.3 | 22.3 | +0.0 | 원본 깊이 상한 | — | Lateral head of right gastrocnemius @16.4 | — |
| BL40 | BL40-A | 0.6–1.5촌 | 33.4 | 33.4 | 33.4 | +0.0 | 원본 깊이 상한 | — | Lateral head of right gastrocnemius @22.0 | — |
| BL41 | BL41-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL42 | BL42-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL43 | BL43-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL44 | BL44-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL45 | BL45-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL46 | BL46-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL47 | BL47-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL48 | BL48-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL49 | BL49-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | Right latissimus dorsi @10.8 | — |
| BL50 | BL50-A | 0.3–0.6촌 | 17.8 | 17.8 | 17.8 | +0.0 | 원본 깊이 상한 | — | Right latissimus dorsi @11.2 | — |
| BL51 | BL51-A | 0.3–0.6촌 | 17.8 | 17.8 | 17.8 | +0.0 | 원본 깊이 상한 | — | Right serratus posterior inferior @14.2 | — |
| BL52 | BL52-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right iliocostalis lumborum @12.5 | — |
| BL53 | BL53-A | 0.5–1.5촌 | 44.6 | 44.6 | 44.6 | +0.0 | 원본 깊이 상한 | — | Right gluteus maximus @17.4 | — |
| BL54 | BL54-A | 0.5–1.5촌 | 44.6 | 44.6 | 44.6 | +0.0 | 원본 깊이 상한 | — | Right gluteus maximus @18.5 | — |
| BL55 | BL55-A | 0.5–1촌 | 23.8 | 23.8 | 23.8 | +0.0 | 원본 깊이 상한 | — | Lateral head of right gastrocnemius @20.3 | — |
| BL56 | BL56-A | 0.3–1촌 | 23.8 | 23.8 | 23.8 | +0.0 | 원본 깊이 상한 | — | Lateral head of right gastrocnemius @14.7 | — |
| BL57 | BL57-A | 0.5–1.5촌 | 35.7 | 35.7 | 28.7 | -7.0 | 혈관·신경 메시 조기정지 | Right fibular vein (venous) @31.9 | Lateral head of right gastrocnemius @12.5 | — |
| BL58 | BL58-A | 0.5–1.2촌 | 28.6 | 28.6 | 28.6 | +0.0 | 원본 깊이 상한 | — | Lateral head of right gastrocnemius @9.1 | — |
| BL59 | BL59-A | 0.3–1촌 | 23.8 | 23.8 | 23.8 | +0.0 | 원본 깊이 상한 | — | Right flexor hallucis longus @11.1 | — |
| BL60 | BL60-A | 0.3–0.5촌 | 11.9 | 11.9 | 11.9 | +0.0 | 원본 깊이 상한 | — | Right fibularis longus @9.9 | — |
| BL61 | — | 원본 범위 없음 | — | — | — | — | 원본 직자 기법 없음 | — | — | — |
| BL62 | BL62-A | 0.2–0.4촌 | 11.5 | 11.5 | 11.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL63 | BL63-A | 0.3–0.5촌 | 14.3 | 14.3 | 11.3 | -3.0 | 뼈·장기 등 메시 조기정지 | Right fourth metatarsal bone (skeletal) @12.5 | — | — |
| BL64 | BL64-A | 0.3–0.5촌 | 14.3 | 14.3 | 14.3 | +0.0 | 원본 깊이 상한 | — | — | — |
| BL65 | BL65-A | 0.2–0.3촌 | 8.6 | 8.6 | 5.8 | -2.8 | 뼈·장기 등 메시 조기정지 | Proximal phalanx of right little toe (skeletal) @6.4 | Abductor digiti minimi of right foot @3.7 | — |
| BL66 | BL66-A | 0.2–0.3촌 | 8.6 | 8.6 | 5.2 | -3.4 | 뼈·장기 등 메시 조기정지 | Proximal phalanx of right little toe (skeletal) @5.8 | Right flexor digitorum longus @2.6 | — |
| BL67 | BL67-A | 0.1–0.2촌 | 5.7 | 5.7 | 2.9 | -2.8 | 혈관·신경 메시 조기정지 | Set of dorsal digital veins (venous) @3.2 | — | — |
| KI1 | KI1-A | 0.3–0.5촌 | 14.3 | 14.3 | 14.3 | +0.0 | 원본 깊이 상한 | — | Right flexor digitorum brevis @0.0 | — |
| KI2 | KI2-A | 0.3–0.5촌 | 14.3 | 14.3 | 14.3 | +0.0 | 원본 깊이 상한 | — | — | — |
| KI3 | KI3-A | 0.3–0.5촌 | 11.9 | 11.9 | 7.7 | -4.2 | 혈관·신경 메시 조기정지 | Right posterior tibial vein (venous) @8.5 | — | — |
| KI4 | KI4-A | 0.2–0.3촌 | 7.1 | 7.1 | 7.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| KI5 | KI5-A | 0.1–0.3촌 | 8.6 | 8.6 | 1.3 | -7.3 | 혈관·신경 메시 조기정지 | Right posterior tibial vein (venous) @1.4 | — | — |
| KI6 | KI6-A | 0.3–0.5촌 | 14.3 | 14.3 | 9.9 | -4.4 | 뼈·장기 등 메시 조기정지 | Right talus (skeletal) @11.0 | Right tibialis posterior @1.3 | — |
| KI7 | KI7-A | 0.3–0.5촌 | 11.9 | 11.9 | 0.0 | -11.9 | 혈관·신경 메시 조기정지 | Right posterior tibial vein (venous) @0.0 | Right soleus @7.9 | Right soleus @7.9 |
| KI8 | KI8-A | 0.3–0.5촌 | 11.9 | 11.9 | 11.9 | +0.0 | 원본 깊이 상한 | — | Right flexor digitorum longus @4.9 | — |
| KI9 | KI9-A | 0.3–0.8촌 | 19.0 | 19.0 | 16.8 | -2.2 | 혈관·신경 메시 조기정지 | Right posterior tibial artery (arterial) @18.7 | Right soleus @3.1 | — |
| KI10 | KI10-A | 0.5–1촌 | 22.3 | 22.3 | 22.3 | +0.0 | 원본 깊이 상한 | — | — | — |
| KI11 | KI11-A | 0.5–0.8촌 | 17.8 | 17.8 | 17.8 | +0.0 | 원본 깊이 상한 | — | Right internal oblique @11.2 | — |
| KI12 | KI12-A | 0.5–0.8촌 | 23.8 | 23.8 | 23.8 | +0.0 | 원본 깊이 상한 | — | Right internal oblique @13.9 | — |
| KI13 | KI13-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right external oblique @12.4 | — |
| KI14 | KI14-A | 0.5–1촌 | 29.7 | 29.7 | 21.0 | -8.7 | 뼈·장기 등 메시 조기정지 | Proximal part of ileum (digestive) @23.3 | Right external oblique @9.9 | Right transversus abdominis @29.1, Right rectus abdominis @29.5 |
| KI15 | KI15-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right external oblique @9.0 | — |
| KI16 | KI16-A | 0.5–1촌 | 29.7 | 29.7 | 17.0 | -12.7 | 뼈·장기 등 메시 조기정지 | Distal part of jejunum (digestive) @18.9 | Right external oblique @4.3 | Right rectus abdominis @20.5, Right transversus abdominis @23.3 |
| KI17 | KI17-A | 0.5–1촌 | 29.7 | 29.7 | 12.6 | -17.1 | 뼈·장기 등 메시 조기정지 | Transverse colon (digestive) @14.0 | Right external oblique @3.3 | Right rectus abdominis @17.8, Right transversus abdominis @23.1 |
| KI18 | KI18-A | 0.5–1촌 | 29.7 | 29.7 | 18.8 | -10.9 | 혈관·신경 메시 조기정지 | Right superior epigastric artery (arterial) @20.9 | Right external oblique @5.3 | Right transversus abdominis @24.5 |
| KI19 | KI19-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | Right external oblique @1.5 | — |
| KI20 | KI20-A | 0.3–0.8촌 | 23.8 | 23.8 | 16.6 | -7.2 | 혈관·신경 메시 조기정지 | Hepatovenous segment IV (venous) @18.4 | Right external oblique @3.5 | — |
| KI21 | KI21-A | 0.3–0.7촌 | 20.8 | 20.8 | 11.5 | -9.3 | 혈관·신경 메시 조기정지 | Right superior epigastric artery (arterial) @12.8 | Right external oblique @2.7 | Right rectus abdominis @12.9 |
| KI22 | KI22-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | Sternocostal part of right pectoralis major @3.8 | — |
| KI23 | KI23-A | 0.2–0.4촌 | 6.8 | 6.8 | 6.8 | +0.0 | 원본 깊이 상한 | — | Sternocostal part of right pectoralis major @4.2 | — |
| KI24 | KI24-A | 0.2–0.4촌 | 6.8 | 6.8 | 6.8 | +0.0 | 원본 깊이 상한 | — | Sternocostal part of right pectoralis major @5.8 | — |
| KI25 | KI25-A | 0.3–0.4촌 | 6.8 | 6.8 | 6.8 | +0.0 | 원본 깊이 상한 | — | Sternocostal part of right pectoralis major @6.4 | — |
| KI26 | KI26-A | 0.2–0.4촌 | 6.8 | 6.8 | 6.8 | +0.0 | 원본 깊이 상한 | — | — | — |
| KI27 | KI27-A | 0.2–0.4촌 | 6.8 | 6.8 | 6.8 | +0.0 | 원본 깊이 상한 | — | — | — |
| PC1 | PC1-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | Sternocostal part of right pectoralis major @3.1 | — |
| PC2 | PC2-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | Long head of right biceps brachii @7.1 | — |
| PC3 | PC3-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Short head of right biceps brachii @13.3 | — |
| PC4 | PC4-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Right flexor carpi radialis @1.3 | — |
| PC5 | PC5-A | 0.5–1촌 | 22.2 | 22.2 | 11.3 | -10.9 | 혈관·신경 메시 조기정지 | Right Median nerve (nervous) @12.6 | Right flexor carpi radialis @0.5 | — |
| PC6 | PC6-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Right flexor digitorum superficialis @2.8 | — |
| PC7 | PC7-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | Right flexor digitorum profundus @10.2 | — |
| PC8 | PC8-A | 0.3–0.5촌 | 11.1 | 11.1 | 5.9 | -5.2 | 혈관·신경 메시 조기정지 | Proper palmar digital vein of right little finger (venous) @6.6 | Right palmaris longus @1.5 | Set of lumbricals of right hand @6.5 |
| PC9 | PC9-A | 0.1–0.2촌 | 4.4 | 4.4 | 4.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| TE1 | TE1-A | 0.1–0.2촌 | 4.4 | 4.4 | 1.9 | -2.5 | 혈관·신경 메시 조기정지 | Set of dorsal digital arteries (arterial) @2.1 | — | — |
| TE2 | TE2-A | 0.3–0.5촌 | 11.1 | 11.1 | 3.7 | -7.4 | 혈관·신경 메시 조기정지 | Set of dorsal digital arteries (arterial) @4.1 | Set of dorsal interossei of right hand @4.8 | Set of dorsal interossei of right hand @4.8 |
| TE3 | TE3-A | 0.3–0.5촌 | 11.1 | 11.1 | 3.5 | -7.6 | 혈관·신경 메시 조기정지 | Set of dorsal metacarpal arteries (arterial) @3.9 | Set of dorsal interossei of right hand @3.4 | — |
| TE4 | TE4-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | Right extensor digitorum @7.5 | — |
| TE5 | TE5-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Right extensor digitorum @11.2 | — |
| TE6 | TE6-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Right extensor digitorum @13.2 | — |
| TE7 | TE7-A | 0.5–0.9촌 | 20.0 | 20.0 | 20.0 | +0.0 | 원본 깊이 상한 | — | Right extensor digiti minimi @12.4 | — |
| TE8 | TE8-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Right extensor digitorum @11.0 | — |
| TE9 | TE9-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Right extensor carpi ulnaris @19.9 | — |
| TE10 | TE10-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| TE11 | TE11-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| TE12 | TE12-A | 0.3–0.7촌 | 15.6 | 15.6 | 15.6 | +0.0 | 원본 깊이 상한 | — | — | — |
| TE13 | TE13-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Spinal part of right deltoid @15.4 | — |
| TE14 | TE14-A | 0.5–1촌 | 22.2 | 22.2 | 22.2 | +0.0 | 원본 깊이 상한 | — | Spinal part of right deltoid @16.4 | — |
| TE15 | TE15-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| TE16 | TE16-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| TE17 | TE17-A | 0.5–1촌 | 17.9 | 17.9 | 0.0 | -17.9 | 뼈·장기 등 메시 조기정지 | External ear (sensory) @0.0 | — | — |
| TE18 | TE18-A | 0.1–0.2촌 | 3.6 | 3.6 | 0.0 | -3.6 | 뼈·장기 등 메시 조기정지 | External ear (sensory) @0.0 | — | — |
| TE19 | TE19-A | 0.1–0.2촌 | 3.6 | 3.6 | 1.7 | -1.9 | 뼈·장기 등 메시 조기정지 | Right temporal bone (skeletal) @1.9 | Right temporalis @0.6 | — |
| TE20 | TE20-A | 0.1–0.2촌 | 3.6 | 3.6 | 0.8 | -2.8 | 뼈·장기 등 메시 조기정지 | Right parietal bone (skeletal) @0.9 | — | — |
| TE21 | TE21-A | 0.3–0.5촌 | 9.0 | 9.0 | 5.0 | -4.0 | 뼈·장기 등 메시 조기정지 | Right temporal bone (skeletal) @5.6 | Right temporalis @3.3 | — |
| TE22 | TE22-A | 0.1–0.2촌 | 3.6 | 3.6 | 3.6 | +0.0 | 원본 깊이 상한 | — | — | — |
| TE23 | TE23-A | 0.2–0.3촌 | 5.4 | 5.4 | 3.1 | -2.3 | 뼈·장기 등 메시 조기정지 | Frontal bone (skeletal) @3.4 | Palpebral part of right orbicularis oculi @1.8 | — |
| GB1 | GB1-A | 0.2–0.3촌 | 5.4 | 45.0 | 4.9 | -0.5 | 담경: 문헌 깊이 미반영 | Right lacrimal gland (sensory) @5.4 | Orbital part of right orbicularis oculi @0.3 | — |
| GB2 | GB2-A | 0.3–0.5촌 | 9.0 | 45.0 | 3.3 | -5.7 | 담경: 문헌 깊이 미반영 | External ear (sensory) @3.7 | — | — |
| GB3 | GB3-A | 0.2–0.3촌 | 5.4 | 45.0 | 25.3 | +19.9 | 담경: 문헌 깊이 미반영 | Sphenoid bone (skeletal) @28.1 | — | — |
| GB4 | GB4-A | 0.2–0.3촌 | 5.4 | 45.0 | 10.1 | +4.7 | 담경: 문헌 깊이 미반영 | Sphenoid bone (skeletal) @11.2 | Right temporalis @4.9 | — |
| GB5 | GB5-A | 0.2–0.3촌 | 5.4 | 45.0 | 7.4 | +2.0 | 담경: 문헌 깊이 미반영 | Right parietal bone (skeletal) @8.2 | Right temporalis @3.8 | — |
| GB6 | GB6-A | 0.2–0.3촌 | 5.4 | 45.0 | 7.1 | +1.7 | 담경: 문헌 깊이 미반영 | Right temporal bone (skeletal) @7.9 | Right temporalis @5.1 | — |
| GB7 | GB7-A | 0.2–0.3촌 | 5.4 | 45.0 | 4.6 | -0.8 | 담경: 문헌 깊이 미반영 | Right temporal bone (skeletal) @5.1 | Right temporalis @3.5 | — |
| GB8 | GB8-A | 0.2–0.3촌 | 5.4 | 45.0 | 2.7 | -2.7 | 담경: 문헌 깊이 미반영 | Right parietal bone (skeletal) @3.0 | Right temporalis @1.2 | — |
| GB9 | GB9-A | 0.2–0.3촌 | 5.4 | 45.0 | 2.6 | -2.8 | 담경: 문헌 깊이 미반영 | Right parietal bone (skeletal) @2.9 | Right temporalis @2.0 | — |
| GB10 | GB10-A | 0.2–0.3촌 | 5.4 | 45.0 | 4.1 | -1.3 | 담경: 문헌 깊이 미반영 | Right parietal bone (skeletal) @4.5 | Right temporalis @3.2 | — |
| GB11 | GB11-A | 0.2–0.3촌 | 5.4 | 45.0 | 5.0 | -0.4 | 담경: 문헌 깊이 미반영 | Right parietal bone (skeletal) @5.5 | — | — |
| GB12 | GB12-A | 0.2–0.3촌 | 5.4 | 45.0 | 7.6 | +2.2 | 담경: 문헌 깊이 미반영 | Right temporal bone (skeletal) @8.4 | — | — |
| GB13 | GB13-A | 0.2–0.3촌 | 5.4 | 45.0 | 5.9 | +0.5 | 담경: 문헌 깊이 미반영 | Frontal bone (skeletal) @6.5 | — | — |
| GB14 | GB14-A | 0.2–0.3촌 | 5.4 | 45.0 | 4.5 | -0.9 | 담경: 문헌 깊이 미반영 | Frontal bone (skeletal) @5.0 | — | — |
| GB15 | GB15-A | 0.2–0.3촌 | 5.4 | 45.0 | 5.0 | -0.4 | 담경: 문헌 깊이 미반영 | Frontal bone (skeletal) @5.6 | — | — |
| GB16 | GB16-A | 0.2–0.3촌 | 5.4 | 45.0 | 6.0 | +0.6 | 담경: 문헌 깊이 미반영 | Frontal bone (skeletal) @6.7 | — | — |
| GB17 | GB17-A | 0.2–0.3촌 | 5.4 | 45.0 | 6.2 | +0.8 | 담경: 문헌 깊이 미반영 | Right parietal bone (skeletal) @6.9 | — | — |
| GB18 | GB18-A | 0.2–0.3촌 | 5.4 | 45.0 | 3.6 | -1.8 | 담경: 문헌 깊이 미반영 | Right parietal bone (skeletal) @4.0 | — | — |
| GB19 | GB19-A | 0.2–0.3촌 | 5.4 | 45.0 | 7.2 | +1.8 | 담경: 문헌 깊이 미반영 | Occipital bone (skeletal) @8.0 | — | — |
| GB20 | GB20-A | 0.3–1촌 | 17.9 | 80.0 | 9.9 | -8.0 | 담경: 문헌 깊이 미반영 | Occipital bone (skeletal) @11.0 | Right semispinalis capitis @7.8 | — |
| GB21 | GB21-A | 0.3–0.5촌 | 8.5 | 100.0 | 23.9 | +15.4 | 담경: 문헌 깊이 미반영 | Right humerus (skeletal) @26.6 | Acromial part of right deltoid @7.2 | — |
| GB22 | GB22-A | 0.2–0.3촌 | 5.1 | 100.0 | 37.5 | +32.4 | 담경: 문헌 깊이 미반영 | Right humerus (skeletal) @41.7 | — | — |
| GB23 | GB23-A | 0.2–0.3촌 | 5.1 | 100.0 | 32.1 | +27.0 | 담경: 문헌 깊이 미반영 | Right fifth rib (skeletal) @35.7 | — | — |
| GB24 | GB24-A | 0.3–0.5촌 | 14.9 | 100.0 | 30.0 | +15.1 | 담경: 문헌 깊이 미반영 | Hepatovenous segment V (venous) @33.3 | Right external oblique @8.6 | — |
| GB25 | GB25-A | 0.3–0.5촌 | 14.9 | 100.0 | 35.1 | +20.2 | 담경: 문헌 깊이 미반영 | Right kidney (urinary) @39.0 | Right transversus abdominis @5.2 | — |
| GB26 | GB26-A | 0.5–0.8촌 | 23.8 | 100.0 | 12.3 | -11.5 | 담경: 문헌 깊이 미반영 | Right hip bone (skeletal) @13.7 | Right external oblique @11.0 | — |
| GB27 | GB27-A | 0.5–0.8촌 | 23.8 | 100.0 | 65.3 | +41.5 | 담경: 문헌 깊이 미반영 | Right hip bone (skeletal) @72.6 | Right internal oblique @10.6 | — |
| GB28 | GB28-A | 0.5–0.8촌 | 17.8 | 100.0 | 64.8 | +47.0 | 담경: 문헌 깊이 미반영 | Right femur (skeletal) @72.0 | — | — |
| GB29 | GB29-A | 0.5–1촌 | 29.7 | 120.0 | 55.6 | +25.9 | 담경: 문헌 깊이 미반영 | Right hip bone (skeletal) @61.8 | Right tensor fasciae latae @5.5 | — |
| GB30 | GB30-A | 1–2촌 | 44.5 | 120.0 | 106.7 | +62.2 | 담경: 문헌 깊이 미반영 | Right hip bone (skeletal) @118.5 | Right gluteus maximus @22.4 | — |
| GB31 | GB31-A | 0.5–1.5촌 | 33.4 | 100.0 | 90.0 | +56.6 | 담경: 문헌 깊이 미반영 | — | Right vastus lateralis @22.2 | — |
| GB32 | GB32-A | 0.5–1촌 | 22.3 | 100.0 | 41.5 | +19.2 | 담경: 문헌 깊이 미반영 | Right femur (skeletal) @46.1 | Right vastus lateralis @16.2 | — |
| GB33 | GB33-A | 0.3–0.5촌 | 11.9 | 100.0 | 19.0 | +7.1 | 담경: 문헌 깊이 미반영 | Right fibula (skeletal) @21.1 | — | — |
| GB34 | GB34-A | 0.8–1.2촌 | 28.6 | 100.0 | 25.8 | -2.8 | 담경: 문헌 깊이 미반영 | Right fibula (skeletal) @28.7 | Right extensor digitorum longus @20.7 | — |
| GB35 | GB35-A | 0.3–0.8촌 | 19.0 | 80.0 | 15.1 | -3.9 | 담경: 문헌 깊이 미반영 | Right fibula (skeletal) @16.8 | Right fibularis longus @8.1 | — |
| GB36 | GB36-A | 0.3–0.8촌 | 19.0 | 80.0 | 15.0 | -4.0 | 담경: 문헌 깊이 미반영 | Right fibula (skeletal) @16.7 | Right fibularis longus @8.6 | — |
| GB37 | GB37-A | 0.5–0.9촌 | 21.4 | 80.0 | 9.4 | -12.0 | 담경: 문헌 깊이 미반영 | Right Superficial fibular nerve (nervous) @10.4 | Right extensor digitorum longus @6.0 | Right extensor hallucis longus @13.6, Right flexor hallucis longus @16.9 |
| GB38 | GB38-A | 0.3–0.7촌 | 16.7 | 80.0 | 8.1 | -8.6 | 담경: 문헌 깊이 미반영 | Right Superficial fibular nerve (nervous) @9.0 | Right extensor digitorum longus @5.1 | Right extensor hallucis longus @11.7 |
| GB39 | GB39-A | 0.3–0.5촌 | 11.9 | 80.0 | 4.0 | -7.9 | 담경: 문헌 깊이 미반영 | Right fibula (skeletal) @4.4 | — | — |
| GB40 | GB40-A | 0.3–0.5촌 | 11.9 | 12.0 | 10.8 | -1.1 | 담경: 문헌 깊이 미반영 | — | Right extensor digitorum longus @5.1 | Right extensor hallucis brevis @11.9 |
| GB41 | GB41-A | 0.3–0.5촌 | 14.3 | 12.0 | 2.3 | -12.0 | 담경: 문헌 깊이 미반영 | Dorsal metacarpal vein (venous) @2.5 | Right extensor digitorum longus @4.1 | Right extensor digitorum longus @4.1 |
| GB42 | GB42-A | 0.1–0.4촌 | 11.5 | 12.0 | 10.8 | -0.7 | 담경: 문헌 깊이 미반영 | — | — | — |
| GB43 | GB43-A | 0.2–0.3촌 | 8.6 | 12.0 | 10.8 | +2.2 | 담경: 문헌 깊이 미반영 | — | — | — |
| GB44 | GB44-A | 0.1–0.2촌 | 5.7 | 4.0 | 3.6 | -2.1 | 담경: 문헌 깊이 미반영 | — | Right extensor digitorum longus @5.4 | Right extensor digitorum longus @5.4 |
| LR1 | LR1-A | 0.1–0.2촌 | 5.7 | 5.7 | 5.7 | +0.0 | 원본 깊이 상한 | — | — | — |
| LR2 | LR2-A | 0.2–0.3촌 | 8.6 | 8.6 | 7.2 | -1.4 | 혈관·신경 메시 조기정지 | Dorsal metacarpal vein (venous) @8.0 | — | — |
| LR3 | LR3-A | 0.3–0.5촌 | 14.3 | 14.3 | 2.2 | -12.1 | 혈관·신경 메시 조기정지 | Dorsal venous arch of right foot (venous) @2.4 | — | — |
| LR4 | LR4-A | 0.3–0.5촌 | 11.9 | 11.9 | 11.9 | +0.0 | 원본 깊이 상한 | — | Right tibialis anterior @10.0 | — |
| LR5 | LR5-A | 0.3–0.5촌 | 11.9 | 11.9 | 7.3 | -4.6 | 뼈·장기 등 메시 조기정지 | Right tibia (skeletal) @8.1 | — | — |
| LR6 | LR6-A | 0.3–0.5촌 | 11.9 | 11.9 | 6.4 | -5.5 | 뼈·장기 등 메시 조기정지 | Right tibia (skeletal) @7.1 | — | — |
| LR7 | LR7-A | 0.3–0.6촌 | 14.3 | 14.3 | 14.3 | +0.0 | 원본 깊이 상한 | — | Right semitendinosus @3.0 | — |
| LR8 | LR8-A | 0.3–0.8촌 | 17.8 | 17.8 | 17.8 | +0.0 | 원본 깊이 상한 | — | Right semitendinosus @0.5 | — |
| LR9 | LR9-A | 0.5–0.7촌 | 15.6 | 15.6 | 15.6 | +0.0 | 원본 깊이 상한 | — | Right sartorius @0.0 | — |
| LR10 | LR10-A | 0.5–1촌 | 22.3 | 22.3 | 22.3 | +0.0 | 원본 깊이 상한 | — | — | — |
| LR11 | LR11-A | 0.3–0.7촌 | 15.6 | 15.6 | 15.6 | +0.0 | 원본 깊이 상한 | — | — | — |
| LR12 | LR12-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | Right internal oblique @9.9 | — |
| LR13 | LR13-A | 0.5–0.8촌 | 23.8 | 23.8 | 23.8 | +0.0 | 원본 깊이 상한 | — | Right transversus abdominis @12.0 | — |
| LR14 | LR14-A | 0.2–0.3촌 | 8.9 | 8.9 | 8.9 | +0.0 | 원본 깊이 상한 | — | Abdominal part of right pectoralis major @3.2 | — |
| CV1 | CV1-A | 0.3–1촌 | 22.3 | 22.3 | 22.3 | +0.0 | 원본 깊이 상한 | — | — | — |
| CV2 | CV2-A | 0.5–1촌 | 22.3 | 22.3 | 22.3 | +0.0 | 원본 깊이 상한 | — | — | — |
| CV3 | CV3-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | — | — |
| CV4 | CV4-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | — | — |
| CV5 | CV5-A | 0.5–1촌 | 29.7 | 29.7 | 22.0 | -7.7 | 뼈·장기 등 메시 조기정지 | Proximal part of ileum (digestive) @24.4 | — | — |
| CV6 | CV6-A | 0.5–1촌 | 29.7 | 29.7 | 19.6 | -10.1 | 뼈·장기 등 메시 조기정지 | Proximal part of ileum (digestive) @21.8 | — | — |
| CV7 | CV7-A | 0.5–1촌 | 29.7 | 29.7 | 17.8 | -11.9 | 뼈·장기 등 메시 조기정지 | Distal part of jejunum (digestive) @19.8 | — | — |
| CV8 | — | 원본 범위 없음 | — | — | — | — | 원본 직자 기법 없음 | — | — | — |
| CV9 | CV9-A | 0.5–1촌 | 29.7 | 29.7 | 23.0 | -6.7 | 뼈·장기 등 메시 조기정지 | Distal part of jejunum (digestive) @25.6 | — | — |
| CV10 | CV10-A | 0.5–1촌 | 29.7 | 29.7 | 10.8 | -18.9 | 뼈·장기 등 메시 조기정지 | Transverse colon (digestive) @12.0 | — | — |
| CV11 | CV11-A | 0.5–1촌 | 29.7 | 29.7 | 29.7 | +0.0 | 원본 깊이 상한 | — | — | — |
| CV12 | CV12-A | 0.5–1촌 | 29.7 | 29.7 | 23.1 | -6.6 | 뼈·장기 등 메시 조기정지 | Stomach (digestive) @25.7 | — | — |
| CV13 | CV13-A | 0.5–1촌 | 29.7 | 29.7 | 16.7 | -13.0 | 혈관·신경 메시 조기정지 | Hepatovenous segment III (venous) @18.6 | — | — |
| CV14 | CV14-A | 원본 범위 없음 | 0.0 | — | — | — | 직자 시뮬레이션 잠금 | — | — | — |
| CV15 | CV15-A | 0.3–0.5촌 | 8.5 | 8.5 | 2.2 | -6.3 | 뼈·장기 등 메시 조기정지 | Xiphoid process (skeletal) @2.4 | Diaphragm @7.5 | Diaphragm @7.5 |
| CV16 | CV16-A | 0.2–0.3촌 | 5.1 | 5.1 | 0.0 | -5.1 | 뼈·장기 등 메시 조기정지 | Body of sternum (skeletal) @0.0 | — | — |
| CV17 | CV17-A | 0.3–0.5촌 | 8.5 | 8.5 | 3.2 | -5.3 | 뼈·장기 등 메시 조기정지 | Body of sternum (skeletal) @3.6 | — | — |
| CV18 | CV18-A | 0.2–0.3촌 | 5.1 | 5.1 | 2.0 | -3.1 | 뼈·장기 등 메시 조기정지 | Body of sternum (skeletal) @2.2 | — | — |
| CV19 | CV19-A | 0.2–0.3촌 | 5.1 | 5.1 | 2.8 | -2.3 | 뼈·장기 등 메시 조기정지 | Body of sternum (skeletal) @3.1 | — | — |
| CV20 | CV20-A | 0.2–0.3촌 | 5.1 | 5.1 | 2.1 | -3.0 | 뼈·장기 등 메시 조기정지 | Manubrium (skeletal) @2.3 | — | — |
| CV21 | CV21-A | 0.2–0.3촌 | 5.1 | 5.1 | 1.6 | -3.5 | 뼈·장기 등 메시 조기정지 | Manubrium (skeletal) @1.8 | — | — |
| CV22 | CV22-C | 0.3–0.5촌 | 8.5 | 8.5 | 3.3 | -5.2 | 뼈·장기 등 메시 조기정지 | Manubrium (skeletal) @3.7 | Left sternocleidomastoid @7.6 | Left sternocleidomastoid @7.6 |
| CV23 | CV23-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | Left platysma @4.8 | — |
| CV24 | CV24-A | 0.2–0.3촌 | 5.1 | 5.1 | 5.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV1 | GV1-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV2 | GV2-A | 0.3–0.5촌 | 11.1 | 11.1 | 11.1 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV3 | GV3-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV4 | GV4-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | Right latissimus dorsi @13.0 | — |
| GV5 | GV5-A | 0.3–0.5촌 | 14.9 | 14.9 | 14.9 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV6 | GV6-A | 0.3–0.5촌 | 14.9 | 14.9 | 9.9 | -5.0 | 뼈·장기 등 메시 조기정지 | Eleventh thoracic vertebra (skeletal) @11.0 | Ascending part of right trapezius @7.4 | Right latissimus dorsi @11.0, Right serratus posterior inferior @13.4 |
| GV7 | GV7-A | 0.3–0.5촌 | 14.9 | 14.9 | 6.9 | -8.0 | 뼈·장기 등 메시 조기정지 | Tenth thoracic vertebra (skeletal) @7.7 | Ascending part of left trapezius @1.8 | Right latissimus dorsi @9.1, Left latissimus dorsi @9.2 |
| GV8 | GV8-A | 0.3–0.5촌 | 14.9 | 14.9 | 8.8 | -6.1 | 뼈·장기 등 메시 조기정지 | Ninth thoracic vertebra (skeletal) @9.8 | Ascending part of right trapezius @1.6 | — |
| GV9 | GV9-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | Ascending part of right trapezius @6.1 | — |
| GV10 | GV10-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV11 | GV11-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV12 | GV12-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | Ascending part of right trapezius @5.8 | — |
| GV13 | GV13-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV14 | GV14-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV15 | GV15-A | 0.3–0.5촌 | 8.5 | 8.5 | 8.5 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV16 | GV16-A | 0.3–0.5촌 | 9.0 | 9.0 | 3.8 | -5.2 | 뼈·장기 등 메시 조기정지 | Occipital bone (skeletal) @4.2 | — | — |
| GV17 | GV17-A | 0.2–0.3촌 | 5.4 | 5.4 | 2.3 | -3.1 | 뼈·장기 등 메시 조기정지 | Occipital bone (skeletal) @2.5 | — | — |
| GV18 | GV18-A | 0.2–0.3촌 | 5.4 | 5.4 | 4.2 | -1.2 | 뼈·장기 등 메시 조기정지 | Occipital bone (skeletal) @4.7 | — | — |
| GV19 | GV19-A | 0.2–0.3촌 | 5.4 | 5.4 | 4.1 | -1.3 | 뼈·장기 등 메시 조기정지 | Right parietal bone (skeletal) @4.6 | — | — |
| GV20 | GV20-B | 0.2–0.3촌 | 5.4 | 5.4 | 1.4 | -4.0 | 뼈·장기 등 메시 조기정지 | Left parietal bone (skeletal) @1.6 | — | — |
| GV21 | GV21-A | 0.2–0.3촌 | 5.4 | 5.4 | 2.7 | -2.7 | 뼈·장기 등 메시 조기정지 | Left parietal bone (skeletal) @3.0 | — | — |
| GV22 | — | 원본 범위 없음 | — | — | — | — | 원본 직자 기법 없음 | — | — | — |
| GV23 | GV23-A | 0.2–0.3촌 | 5.4 | 5.4 | 3.2 | -2.2 | 뼈·장기 등 메시 조기정지 | Frontal bone (skeletal) @3.6 | — | — |
| GV24 | GV24-A | 0.2–0.3촌 | 5.4 | 5.4 | 3.1 | -2.3 | 뼈·장기 등 메시 조기정지 | Frontal bone (skeletal) @3.4 | — | — |
| GV25 | GV25-A | 0.1–0.2촌 | 3.6 | 3.6 | 3.6 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV26 | GV26-A | 0.2–0.3촌 | 5.4 | 5.4 | 5.4 | +0.0 | 원본 깊이 상한 | — | — | — |
| GV27 | GV27-A | 0.1–0.3촌 | 5.4 | 5.4 | 5.4 | +0.0 | 원본 깊이 상한 | — | Orbicularis oris @3.8 | — |
| GV28 | GV28-A | 0.1–0.2촌 | 3.6 | 3.6 | 0.1 | -3.5 | 뼈·장기 등 메시 조기정지 | Gingiva of upper jaw (skeletal) @0.1 | Orbicularis oris @0.0 | — |
