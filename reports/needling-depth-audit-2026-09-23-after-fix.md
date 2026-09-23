# 자침 깊이 감사 (2026-09-23)

- 대상: `data/needling-direct.json`의 직자 기법 전부. 경로는 뷰어(`app/scene.tsx`)와 같은 피부 투영과 면 법선(또는 direct 시드의 지정 방향)으로 계산했습니다.
- 깊이 상한 = 문헌 촌 상한 × 혈 부위의 모델 비례 단위(`mmPerCun`, `scripts/needling/export_direct_profiles.mjs`). 임상 안전심도가 아닙니다.
- 표시: empty = 상한 안에 피부·지방 외 구조 없음, bone = 상한 안에서 뼈에 닿음, hazard = 상한 안에서 혈관·신경·흉막·장기를 지남. 검토 신호이며 판정이 아닙니다.

집계: 354혈 · empty 129 · bone 70 · hazard 32 · 피부 투영 실패 0

| 혈 | 촌 | mm/촌 | 상한 mm | 표시 | 상한 안 구조 (진입–이탈 mm) | 상한 다음 첫 구조 |
|---|---|---:|---:|---|---|---|
| LU1 | 0.3–0.5 | 17 | 8.5 | empty | — | Sternocostal part pectoralis major 10.6+ |
| LU2 | 0.3–0.5 | 17 | 8.5 | empty | — | axillary vein 12.6–17.9 |
| LU3 | 0.3–0.5 | 20 | 10 | — | Long head biceps brachii 7.9+ | — |
| LU4 | 0.3–0.5 | 20 | 10 | empty | — | Long head biceps brachii 15.2+ |
| LU5 | 0.3–0.5 | 20 | 10 | empty | — | brachialis 19.4+ |
| LU6 | 0.5–1 | 22.4 | 22.4 | hazard | cephalic vein 4.3–7.9; brachioradialis 6–14.6; Humeral head pronator teres 15.1–18.2; Ulnar head pronator teres 18.7–23.3 | flexor digitorum superficialis 24.5–26.5 |
| LU7 | 0.2–0.3 | 22.4 | 6.7 | empty | — | extensor carpi radialis longus 8.2–11.5 |
| LU8 | 0.2–0.3 | 22.4 | 6.7 | hazard | radial artery 4.1–6.8; superficial palmar arterial arch 4.2–5.7 | pronator quadratus 7.9–9.7 |
| LU9 | 0.2–0.3 | 18.3 | 5.5 | empty | — | trapezium 11.9+ |
| LU10 | 0.3–0.5 | 18.3 | 9.1 | empty | — | first metacarpal bone 11.1–20.3 |
| LU11 | 0.1–0.2 | 18.3 | 3.7 | empty | — | Distal phalanx thumb 6.8–15.9 |
| LI1 | 0.1–0.2 | 18.3 | 3.7 | bone | Distal phalanx index finger 3.5–7.2 | — |
| LI2 | 0.2–0.3 | 18.3 | 5.5 | empty | — | arteria radialis indicis 5.6–6.9 |
| LI4 | 0.5–1 | 29.7 | 29.7 | — | Transverse head adductor pollicis 11.9–25.9; Oblique head adductor pollicis 25.3–46.2 | deep palmar arch 40.2–43.3 |
| LI5 | 0.3–0.5 | 18.3 | 9.1 | empty | — | trapezium 15.4+ |
| LI6 | 0.3–0.5 | 22.4 | 11.2 | empty | — | brachioradialis 11.8–14.7 |
| LI7 | 0.5–1 | 22.4 | 22.4 | — | brachioradialis 6.9–11.7; flexor pollicis longus 20.7–32.3 | flexor digitorum profundus 31.2+ |
| LI8 | 0.5–0.8 | 22.4 | 17.9 | — | brachioradialis 6.2–18.3 | supinator 28.3–31.2 |
| LI9 | 0.5–1 | 22.4 | 22.4 | — | brachioradialis 3.5–18 | supinator 24.6+ |
| LI10 | 0.5–1.2 | 22.4 | 26.9 | bone | brachioradialis 3.4–18.5; radius 24.9–41.4 | — |
| LI11 | 0.5–1.5 | 20 | 30 | — | brachioradialis 11.5–26.3 | humerus 32.7–45.2 |
| LI12 | 0.3–0.7 | 20.2 | 14.2 | empty | — | brachioradialis 16.8–28.9 |
| LI13 | 0.3–0.5 | 20 | 10 | empty | — | brachialis 13.1+ |
| LI14 | 0.3–0.7 | 17 | 11.9 | empty | — | Spinal part deltoid 23+ |
| LI15 | 0.5–1.2 | 20 | 24 | bone | Acromial part deltoid 0–4.9; supraspinatus 4.9–9; humerus 8.6+ | — |
| LI16 | 0.3–0.7 | 20.2 | 14.2 | — | Transverse part trapezius 5.7–9.5 | supraspinatus 19+ |
| LI17 | 0.3–0.5 | 18.3 | 9.1 | empty | — | platysma 11.6–14.4 |
| LI18 | 0.3–0.5 | 18.3 | 9.1 | — | sternocleidomastoid 8.2–19.3 | — |
| LI19 | 0.2–0.3 | 18.3 | 5.5 | empty | — | Orbicularis oris 7–10.5 |
| LI20 | 0.2–0.3 | 18.3 | 5.5 | empty | — | zygomaticus minor 7.6–8.5 |
| ST1 | 0.2–0.3 | 18.3 | 5.5 | empty | — | Palpebral part orbicularis oculi 6.5–10 |
| ST2 | 0.2–0.3 | 18.3 | 5.5 | empty | — | zygomaticus minor 9.9–11.6 |
| ST3 | 0.3–0.5 | 18.3 | 9.1 | empty | — | levator anguli oris 13.8–15 |
| ST4 | 0.3–0.5 | 18.3 | 9.1 | — | Orbicularis oris 8.2–12.5 | zygomaticus major 9.8–11 |
| ST5 | 0.2–0.3 | 18.3 | 5.5 | empty | — | platysma 5.7–10 |
| ST6 | 0.3–0.5 | 18.3 | 9.1 | — | Deep part masseter 0.6–4.8 | Mandible 15.9+ |
| ST8 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 2–4.6; Frontal bone 5–9.9 | middle frontal gyrus 16.8+ |
| ST9 | 0.2–0.3 | 18.3 | 5.5 | — | platysma 2.8–5.7 | thyrohyoid 15.5–16.9 |
| ST10 | 0.3–0.4 | 18.3 | 7.3 | — | platysma 3.1–5.8 | sternohyoid 14.2–16.5 |
| ST11 | 0.3–0.5 | 20 | 10 | — | platysma 0.4–5.1; sternocleidomastoid 3–7.2 | brachiocephalic vein 14.8+ |
| ST12 | 0.3–0.5 | 17 | 8.5 | empty | — | platysma 10.8–12.7 |
| ST13 | 0.2–0.3 | 17 | 5.1 | empty | — | Clavicular part pectoralis major 11.8+ |
| ST14 | 0.2–0.3 | 17 | 5.1 | empty | — | Sternocostal part pectoralis major 12.8+ |
| ST15 | 0.2–0.3 | 17 | 5.1 | empty | — | Sternocostal part pectoralis major 9.9+ |
| ST16 | 0.2–0.3 | 17 | 5.1 | — | Sternocostal part pectoralis major 3.4+ | — |
| ST18 | 0.2–0.3 | 17 | 5.1 | — | Sternocostal part pectoralis major 0–19.8 | internal intercostal muscle 17+ |
| ST19 | 0.5–0.8 | 17 | 13.6 | — | external oblique 7.2–7.9; rectus abdominis 9.5–18.6 | Hepatovenous segment IV 21.3+ |
| ST20 | 0.5–1 | 17 | 17 | — | external oblique 6.6–7.4; internal oblique 7.5–8.8; rectus abdominis 8.9–21.9 | internal oblique 22.9–23 |
| ST21 | 0.5–1 | 17 | 17 | — | external oblique 7.4–8.1; internal oblique 8.7–9.5; rectus abdominis 10–23.2 | internal oblique 24–25.5 |
| ST22 | 0.5–1 | 17 | 17 | — | external oblique 7.6–8.3; internal oblique 8.5–9.6; rectus abdominis 10.6–28.6 | transversus abdominis 30+ |
| ST23 | 0.5–1 | 29.7 | 29.7 | — | internal oblique 14.9–17.3; external oblique 16.6–16.8; rectus abdominis 19.4–31; internal oblique 21.4–32 | transversus abdominis 31.4–32.2 |
| ST24 | 0.5–1 | 29.7 | 29.7 | — | internal oblique 16.4–19.1; external oblique 16.9–18.1; rectus abdominis 19.4–30.2 | internal oblique 31.1–32 |
| ST25 | 0.5–1 | 29.7 | 29.7 | — | external oblique 16.9–16.9; internal oblique 16.9–17.3; rectus abdominis 18.5–30.9 | transversus abdominis 31.5–33 |
| ST26 | 0.5–1 | 29.7 | 29.7 | — | internal oblique 12.4–13.2; external oblique 13.2–14.5; rectus abdominis 16.6–33.9; internal oblique 25.3–25.7 | transversus abdominis 32.8–35.8 |
| ST27 | 0.5–1 | 29.7 | 29.7 | — | external oblique 11.8–12; rectus abdominis 12.4–31; internal oblique 13.2–15.2 | internal oblique 29.8–32.3 |
| ST28 | 0.5–1 | 29.7 | 29.7 | hazard | superficial epigastric vein 0.8–4.1; internal oblique 16.8–17.5; external oblique 18–18.3; internal oblique 19–23.6; rectus abdominis 20.3–34.9; transversus abdominis 28.8–34.7 | Middle part of ileum 35.3–46.3 |
| ST29 | 0.5–1 | 29.7 | 29.7 | hazard | superficial epigastric vein 5.8–8.7; internal oblique 21.6–26.7; external oblique 23.9–26; rectus abdominis 26.2–33.1 | transversus abdominis 30.4–32.8 |
| ST30 | 0.3–0.5 | 29.7 | 14.9 | empty | — | external oblique 21.5–21.7 |
| ST31 | 0.8–1.5 | 22.3 | 33.4 | empty | — | rectus femoris 41.6+ |
| ST32 | 0.5–1 | 22.3 | 22.3 | — | rectus femoris 10.8–27.6 | vastus intermedius 27.9+ |
| ST33 | 0.5–0.7 | 22.3 | 15.6 | — | rectus femoris 8.3–14.3; vastus intermedius 14.1+ | — |
| ST34 | 0.5–1 | 22.3 | 22.3 | — | rectus femoris 12–20.3; vastus intermedius 18.5–31.3 | — |
| ST35 | 0.3–0.5 | 22.3 | 11.1 | empty | — | patella 16.2+ |
| ST36 | 0.5–1.5 | 23.8 | 35.7 | — | tibialis anterior 8.7–33.2 | Interosseous membrane leg 36.1–38.3 |
| ST37 | 0.5–1.5 | 23.8 | 35.7 | hazard | tibialis anterior 4.3–29.7; anterior tibial vein 20.3–25; Interosseous membrane leg 28.6–30.6; tibialis posterior 31–51 | — |
| ST38 | 0.5–1 | 23.8 | 23.8 | hazard | tibialis anterior 1.6–24.3; anterior tibial vein 16.1–18.5; Interosseous membrane leg 23–25.2 | tibialis posterior 25.1+ |
| ST39 | 0.5–1 | 23.8 | 23.8 | hazard | tibialis anterior 1.7–22.1; anterior tibial vein 14.3–17.6; Interosseous membrane leg 22.2–24.2 | tibialis posterior 25.7–37.4 |
| ST40 | 0.5–1 | 23.8 | 23.8 | — | tibialis anterior 6.4–21.6 | Interosseous membrane leg 24.3–26.6 |
| ST41 | 0.3–0.8 | 28.6 | 22.9 | bone, hazard | dorsalis pedis artery 12.6–14.9; Navicular bone foot 15.2+ | — |
| ST42 | 0.2–0.3 | 28.6 | 8.6 | empty | — | extensor hallucis brevis 9.6–13.4 |
| ST43 | 0.3–0.5 | 28.6 | 14.3 | empty | — | Oblique head adductor hallucis 27.4+ |
| ST44 | 0.2–0.4 | 28.6 | 11.5 | bone | Proximal phalanx second toe 6.6–16.6 | flexor digitorum longus 20.1–21.4 |
| ST45 | 0.1–0.2 | 28.6 | 5.7 | empty | — | — |
| SP1 | 0.1–0.2 | 28.6 | 5.7 | bone | Distal phalanx big toe 5.7+ | — |
| SP2 | 0.2–0.3 | 28.6 | 8.6 | bone, hazard | Set of plantar digital veins 0–1.1; Proximal phalanx big toe 4.4–18.4 | extensor hallucis longus 22.7–23.4 |
| SP3 | 0.3–0.5 | 28.6 | 14.3 | bone, hazard | Set of plantar digital veins 0.4–1.5; Medial head flexor hallucis brevis 5.6–7.4; first metatarsal bone 7.4–26.3 | extensor hallucis brevis 27.1+ |
| SP4 | 0.5–1 | 28.6 | 28.6 | bone | flexor hallucis longus 12.6–15.6; Lateral head flexor hallucis brevis 15.2–21.9; long plantar ligament 20.8–21.8; first metatarsal bone 21.7–39.6 | medial cuneiform bone 37.6–41.2 |
| SP5 | 0.3–0.5 | 28.6 | 14.3 | empty | — | talus 15–22.7 |
| SP6 | 1–1.5 | 23.8 | 35.7 | — | flexor digitorum longus 5.9–27.6; flexor hallucis longus 27.2–50.6 | fibularis brevis 50.4+ |
| SP7 | 0.5–1 | 23.8 | 23.8 | — | soleus 3.1–23.5 | — |
| SP8 | 0.5–1 | 23.8 | 23.8 | — | Medial head gastrocnemius 6–31.1 | soleus 29.7+ |
| SP9 | 0.5–1 | 23.8 | 23.8 | bone | semimembranosus 4.4–7.7; tibia 9.1+ | — |
| SP10 | 0.5–0.8 | 22.3 | 17.8 | — | vastus medialis 2.2–32.5 | — |
| SP11 | 0.3–0.5 | 22.3 | 11.1 | empty | — | adductor longus 12.7+ |
| SP12 | 0.5–0.7 | 22.3 | 15.6 | empty | — | internal oblique 22.8–25.9 |
| SP13 | 0.5–1 | 29.7 | 29.7 | — | external oblique 17.8–19.3; internal oblique 18.2–23.8; transversus abdominis 23.9–27.8 | — |
| SP14 | 0.5–1 | 29.7 | 29.7 | — | external oblique 9.5–10.3; internal oblique 16.9–17.4; internal oblique 18.6–20.5; transversus abdominis 23.9–25.6 | Proximal part of ileum 41.4+ |
| SP15 | 0.5–1 | 29.7 | 29.7 | — | external oblique 13.8–14.1; internal oblique 16.8–18.1; internal oblique 19.3–22.6; transversus abdominis 26–27.8 | Distal part of jejunum 35.5+ |
| SP16 | 0.5–1 | 17 | 17 | — | external oblique 8.3–10.6; rectus abdominis 11.8–18.4; internal oblique 14.7–15.4 | transversus abdominis 19.8–20.4 |
| SP17 | 0.2–0.3 | 17 | 5.1 | empty | — | Sternocostal part pectoralis major 11.4+ |
| SP18 | 0.2–0.3 | 17 | 5.1 | — | Sternocostal part pectoralis major 4.5+ | — |
| SP19 | 0.2–0.3 | 17 | 5.1 | empty | — | Sternocostal part pectoralis major 5.2+ |
| SP20 | 0.2–0.4 | 17 | 6.8 | empty | — | Sternocostal part pectoralis major 12+ |
| SP21 | 0.2–0.3 | 17 | 5.1 | empty | — | serratus anterior 19.6+ |
| HT1 | 0.2–0.5 | 20 | 10 | empty | — | — |
| HT2 | 0.3–0.5 | 17 | 8.5 | empty | — | Short head biceps brachii 9.8–15.9 |
| HT3 | 0.3–0.8 | 20 | 16 | empty | — | brachialis 18.1–22 |
| HT4 | 0.2–0.5 | 22.4 | 11.2 | — | pronator quadratus 7.1–9.4 | ulna 12–16.1 |
| HT5 | 0.3–0.5 | 22.4 | 11.2 | bone, hazard | ulnar vein 2.7–3.7; pronator quadratus 7–8; ulna 10.5–18.3 | extensor indicis 21.1+ |
| HT6 | 0.3–0.5 | 22.4 | 11.2 | bone | ulna 9.1–21.2 | — |
| HT7 | 0.2–0.5 | 18.3 | 9.1 | hazard | ulnar artery 8.3–10.7 | hamate 19.7+ |
| HT8 | 0.3–0.5 | 18.3 | 9.1 | hazard | palmaris longus 4.1–5.9; third common palmar digital artery 6.4–8; Set of lumbricals hand 9.1–12.5 | Set of dorsal interossei hand 21.4–23.3 |
| HT9 | 0.1–0.2 | 18.3 | 3.7 | bone | Distal phalanx little finger 0.9–5 | flexor digitorum profundus 4.7–5.9 |
| SI1 | 0.1–0.2 | 18.3 | 3.7 | bone | Middle phalanx little finger 0–4.2 | flexor digitorum profundus 4–5.4 |
| SI2 | 0.2–0.3 | 18.3 | 5.5 | bone, hazard | fourth common palmar digital artery 2.1–2.8; Abductor digiti minimi hand 3.5–4; Proximal phalanx little finger 4.4–14.4 | Set of lumbricals hand 15.1–16.7 |
| SI3 | 0.5–1 | 18.3 | 18.3 | bone | Abductor digiti minimi hand 0.5–3.3; Flexor digiti minimi brevis hand 3.6–5.2; fifth metacarpal bone 9–14.7; Set of palmar interossei hand 14.8–16.3; Set of lumbricals hand 15.8–17.5 | fourth metacarpal bone 27.5–28.5 |
| SI4 | 0.3–0.5 | 18.3 | 9.1 | — | Humeral head flexor carpi ulnaris 6–8.7 | hamate 16.5–20.8 |
| SI5 | 0.2–0.4 | 18.3 | 7.3 | hazard | basilic vein 0.3–2.9 | lunate 10.5+ |
| SI6 | 0.3–0.5 | 22.4 | 11.2 | bone | ulna 5.4–11.2 | radius 23.1+ |
| SI7 | 0.3–0.5 | 22.4 | 11.2 | — | Ulnar head flexor carpi ulnaris 9.5–15.1 | ulna 21+ |
| SI8 | 0.2–0.5 | 22.4 | 11.2 | empty | — | Long head triceps brachii 15–16.5 |
| SI9 | 0.5–1 | 20 | 20 | empty | — | Spinal part deltoid 24.4–33.6 |
| SI10 | 0.5–1 | 20.2 | 20.2 | — | Spinal part deltoid 13.2–28.7 | infraspinatus muscle 31.6+ |
| SI11 | 0.5–0.5 | 20.2 | 10.1 | empty | — | Ascending part trapezius 15.6+ |
| SI12 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Ascending part trapezius 15.4+ |
| SI13 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Ascending part trapezius 12.9–24.1 |
| SI14 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Transverse part trapezius 11.1–20.9 |
| SI15 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Transverse part trapezius 17.3–24.8 |
| SI16 | 0.3–0.5 | 18.3 | 9.1 | empty | — | — |
| SI17 | 0.3–0.5 | 18.3 | 9.1 | empty | — | sternocleidomastoid 10+ |
| SI18 | 0.2–0.3 | 18.3 | 5.5 | empty | — | zygomaticus minor 9.6–10.9 |
| SI19 | 0.3–0.5 | 18.3 | 9.1 | bone | temporalis 4.1–8.1; temporal bone 7.9–12.2 | inferior temporal gyrus 20.3+ |
| BL1 | 0.1–0.3 | 18.3 | 5.5 | bone | nasalis 2.2–3.2; maxilla 3–7.6 | Left maxilla 19.7+ |
| BL2 | 0.3–0.5 | 18.3 | 9.1 | bone | procerus 3.2–3.9; Frontal bone 4.5–13.4 | Orbital gyrus 17.4+ |
| BL3 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 1.9–4; Frontal bone 4.1–7.5 | superior frontal gyrus 9.5–16 |
| BL4 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 1.9–3.9; Frontal bone 3.8–8.4 | superior frontal gyrus 10–15.6 |
| BL5 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 2.3–4.9; Frontal bone 4.8–10.3 | superior frontal gyrus 11.3–15.7 |
| BL6 | 0.2–0.3 | 18.3 | 5.5 | — | Aponeurosis of epicranius 2.7–5.8 | Frontal bone 5.7–9.7 |
| BL7 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 1.6–4.4; parietal bone 4.5–8.4 | superior frontal gyrus 9.5–19.7 |
| BL8 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 0.1–2.5; parietal bone 2.5–6.6 | superior frontal gyrus 8+ |
| BL9 | 0.2–0.3 | 18.3 | 5.5 | bone | Occipital bone 5.1–9.6 | occipital lobe 13.1–19.6 |
| BL10 | 0.3–0.5 | 18.3 | 9.1 | empty | — | Descending part trapezius 13.2–19.5 |
| BL11 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Transverse part trapezius 10.5–16.7 |
| BL12 | 0.3–0.5 | 20.2 | 10.1 | — | Ascending part trapezius 9.6–16.5 | Transverse part trapezius 11.5–16.8 |
| BL13 | 0.3–0.5 | 20.2 | 10.1 | — | Ascending part trapezius 9–19.7 | — |
| BL14 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Ascending part trapezius 11–23.8 |
| BL15 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Ascending part trapezius 13.4–21.4 |
| BL16 | 0.3–0.5 | 20.2 | 10.1 | — | Ascending part trapezius 9.6–14.5 | — |
| BL17 | 0.3–0.5 | 20.2 | 10.1 | — | Ascending part trapezius 7.6–10.9 | latissimus dorsi 12.3–17.9 |
| BL18 | 0.3–0.5 | 20.2 | 10.1 | empty | — | latissimus dorsi 15.3–21 |
| BL19 | 0.3–0.5 | 20.2 | 10.1 | empty | — | latissimus dorsi 12.8–20.2 |
| BL20 | 0.3–0.5 | 20.2 | 10.1 | — | latissimus dorsi 7–14.4 | serratus posterior inferior 14.6–21.3 |
| BL21 | 0.3–0.5 | 20.2 | 10.1 | — | latissimus dorsi 6.1–11.7 | serratus posterior inferior 13.3–21.8 |
| BL22 | 0.3–0.5 | 20.2 | 10.1 | — | latissimus dorsi 6.8–11.8 | serratus posterior inferior 13.6–22 |
| BL23 | 0.3–1 | 20.2 | 20.2 | — | latissimus dorsi 8.3–13.6; serratus posterior inferior 16.7–18.2; serratus posterior inferior 18.4–20.1; iliocostalis lumborum 20.2–21.7 | longissimus thoracis 30.5+ |
| BL24 | 0.3–0.5 | 20.2 | 10.1 | empty | — | latissimus dorsi 12.6–17.6 |
| BL25 | 0.5–1 | 20.2 | 20.2 | — | latissimus dorsi 11.6–17.8; iliocostalis lumborum 19.1–26.1 | quadratus lumborum 30.8+ |
| BL26 | 0.5–1 | 20.2 | 20.2 | — | latissimus dorsi 5.2–10.4; iliocostalis lumborum 13.8–20.9 | quadratus lumborum 28.5+ |
| BL27 | 0.5–1 | 20.2 | 20.2 | empty | — | iliocostalis lumborum 23.5–29.7 |
| BL28 | 0.5–1 | 20.2 | 20.2 | empty | — | gluteus maximus 25.4+ |
| BL29 | 0.5–1 | 20.2 | 20.2 | empty | — | gluteus maximus 27.1+ |
| BL30 | 0.5–1 | 20.2 | 20.2 | empty | — | gluteus maximus 25.4+ |
| BL31 | 0.5–1.2 | 20.2 | 24.3 | — | iliocostalis lumborum 12.6–23.6 | Posterior sacro-iliac ligamentr 31.7–32.2 |
| BL32 | 0.5–1 | 20.2 | 20.2 | — | iliocostalis lumborum 14.9–26.7 | Posterior sacro-iliac ligamentr 33.6–34.2 |
| BL33 | 0.5–1 | 20.2 | 20.2 | empty | — | gluteus maximus 28+ |
| BL34 | 0.5–1 | 20.2 | 20.2 | empty | — | gluteus maximus 27.9+ |
| BL35 | 0.3–0.8 | 20.2 | 16.2 | empty | — | gluteus maximus 16.3+ |
| BL36 | 0.5–1.5 | 22.3 | 33.4 | empty | — | gluteus maximus 35.9–43.4 |
| BL37 | 0.5–1.5 | 22.3 | 33.4 | — | Long head biceps femoris 12.4+ | — |
| BL38 | 0.5–1 | 22.3 | 22.3 | empty | — | Lateral head gastrocnemius 27.1–30.2 |
| BL39 | 0.3–1 | 23.8 | 23.8 | — | Lateral head gastrocnemius 16.8–30.1 | plantaris 31.3+ |
| BL40 | 0.6–1.5 | 23.8 | 35.7 | hazard | small saphenous vein 21.8–25.9; Medial head gastrocnemius 23.5–30.1; Lateral head gastrocnemius 25.9–29; plantaris 33.4–46.1 | — |
| BL41 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Ascending part trapezius 12.7–22.9 |
| BL42 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Ascending part trapezius 14+ |
| BL43 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Ascending part trapezius 13.4+ |
| BL44 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Ascending part trapezius 11.4–19.9 |
| BL45 | 0.3–0.5 | 20.2 | 10.1 | — | Ascending part trapezius 6.6–13.5 | — |
| BL46 | 0.3–0.5 | 20.2 | 10.1 | empty | — | latissimus dorsi 12.2–19.2 |
| BL47 | 0.3–0.5 | 20.2 | 10.1 | empty | — | latissimus dorsi 13.6–21.3 |
| BL48 | 0.3–0.5 | 20.2 | 10.1 | — | latissimus dorsi 6.8–11.2 | serratus posterior inferior 14.5–20.8 |
| BL49 | 0.3–0.5 | 20.2 | 10.1 | — | latissimus dorsi 7.3–12.4 | serratus posterior inferior 14.4–21.1 |
| BL50 | 0.3–0.6 | 20.2 | 12.1 | — | latissimus dorsi 5.3–12 | serratus posterior inferior 13–19.6 |
| BL51 | 0.3–0.6 | 20.2 | 12.1 | — | latissimus dorsi 5.2–10.7 | iliocostalis lumborum 16.3–21.3 |
| BL52 | 0.5–1 | 20.2 | 20.2 | — | latissimus dorsi 2.5–14.6; iliocostalis lumborum 12.3–18.3; quadratus lumborum 19.2–34.4 | — |
| BL53 | 0.5–1.5 | 20.2 | 30.3 | — | gluteus maximus 17.7–37.7 | — |
| BL54 | 0.5–1.5 | 20.2 | 30.3 | — | gluteus maximus 18.6–45.8 | — |
| BL55 | 0.5–1 | 23.8 | 23.8 | — | Lateral head gastrocnemius 20.4+ | — |
| BL56 | 0.3–1 | 23.8 | 23.8 | — | Lateral head gastrocnemius 14.8–36.5 | — |
| BL57 | 0.5–1.5 | 23.8 | 35.7 | hazard | Lateral head gastrocnemius 12.7–15.8; soleus 20–41.1; fibular vein 32.9–34.1 | tibialis posterior 55.9+ |
| BL58 | 0.5–1.2 | 23.8 | 28.6 | — | calcaneal tendon 9.1–10.5; Lateral head gastrocnemius 9.2–11.1; soleus 14.2–39.3 | — |
| BL59 | 0.3–1 | 23.8 | 23.8 | — | flexor hallucis longus 11.7–32.2 | tibialis posterior 32.6+ |
| BL60 | 0.3–0.5 | 28.6 | 14.3 | empty | — | — |
| BL62 | 0.2–0.4 | 28.6 | 11.5 | empty | — | fibularis longus 15.1–18.3 |
| BL63 | 0.3–0.5 | 23.8 | 11.9 | empty | — | fourth metatarsal bone 12.6+ |
| BL64 | 0.3–0.5 | 28.6 | 14.3 | empty | — | — |
| BL65 | 0.2–0.3 | 28.6 | 8.6 | bone | Abductor digiti minimi foot 4–7; Proximal phalanx little toe 7.9–9.3 | — |
| BL66 | 0.2–0.3 | 28.6 | 8.6 | bone | Proximal phalanx little toe 6.1–10.8 | extensor digitorum longus 12.1–13.6 |
| BL67 | 0.1–0.2 | 28.6 | 5.7 | bone | Distal phalanx little toe 5.1–9 | — |
| KI1 | 0.3–0.5 | 28.6 | 14.3 | — | flexor digitorum brevis 0–3.8; Third lumbrical foot 6.6–10.6 | Oblique head adductor hallucis 15.3–23.6 |
| KI2 | 0.3–0.5 | 28.6 | 14.3 | empty | — | tibialis posterior 23.7–24.7 |
| KI3 | 0.3–0.5 | 23.8 | 11.9 | hazard | posterior tibial vein 8.6–11.2 | — |
| KI4 | 0.2–0.3 | 23.8 | 7.1 | empty | — | — |
| KI5 | 0.1–0.3 | 28.6 | 8.6 | hazard | posterior tibial vein 1.8–2.9; posterior tibial artery 7–8.5 | flexor hallucis longus 17–18.9 |
| KI6 | 0.3–0.5 | 28.6 | 14.3 | bone | tibialis posterior 1.7–4.6; talus 11.2–19.1 | talus 22.4+ |
| KI7 | 0.3–0.5 | 23.8 | 11.9 | hazard | posterior tibial vein 0–1.6; posterior tibial artery 7.6–10; soleus 9.8–9.9 | — |
| KI8 | 0.3–0.5 | 23.8 | 11.9 | — | flexor digitorum longus 6.2–22.3 | flexor hallucis longus 22.5+ |
| KI9 | 0.3–0.8 | 23.8 | 19 | — | soleus 3.1–22.1 | — |
| KI10 | 0.5–1 | 22.3 | 22.3 | empty | — | — |
| KI11 | 0.5–0.8 | 29.7 | 23.8 | empty | — | transversus abdominis 24.6–32.8 |
| KI12 | 0.5–0.8 | 29.7 | 23.8 | empty | — | external oblique 25.5+ |
| KI13 | 0.5–1 | 29.7 | 29.7 | — | Linea alba 29.3–30.4 | Middle part of ileum 33.7–42.2 |
| KI14 | 0.5–1 | 29.7 | 29.7 | — | external oblique 21.8–25.1; internal oblique 23.2–23.4; internal oblique 26.2–26.7; rectus abdominis 28.5–34.8 | transversus abdominis 34.2–36.6 |
| KI15 | 0.5–1 | 29.7 | 29.7 | — | external oblique 18.9–20.6; internal oblique 19.4–20; internal oblique 20.2–21.3; rectus abdominis 20.9–31.1 | transversus abdominis 32.7–33.7 |
| KI16 | 0.5–1 | 29.7 | 29.7 | — | internal oblique 17.1–19.2; external oblique 18–18.4; internal oblique 19.6–20.4; transversus abdominis 19.6–21.6; rectus abdominis 20.7–31.4 | Distal part of jejunum 34–42.8 |
| KI17 | 0.5–1 | 29.7 | 29.7 | hazard | external oblique 14–14.4; internal oblique 14.9–15.2; rectus abdominis 17.8–22.6; internal oblique 19.6–21.4; transversus abdominis 23.2–23.9; Transverse colon 25.6+ | — |
| KI18 | 0.5–1 | 29.7 | 29.7 | — | external oblique 13.1–13.8; internal oblique 13.4–15.3; rectus abdominis 15.4–23.8; internal oblique 23.1–24.6; transversus abdominis 25.5–25.7 | Transverse mesocolon 39.1–41.9 |
| KI19 | 0.5–1 | 17 | 17 | — | external oblique 9.2–9.9; internal oblique 9.9–10.2; rectus abdominis 11.4–23.9 | internal oblique 25.6–26 |
| KI20 | 0.3–0.8 | 17 | 13.6 | — | external oblique 9.8–11.8; internal oblique 10.7–11.2; rectus abdominis 12.8–20.2 | internal oblique 20.8–21 |
| KI21 | 0.3–0.7 | 17 | 11.9 | — | external oblique 7.8–8.5; internal oblique 7.9–8.6; rectus abdominis 10.2–18.3 | internal oblique 19.8–20 |
| KI22 | 0.2–0.3 | 17 | 5.1 | — | Sternocostal part pectoralis major 3.9–18.6 | fifth costal cartilage 13.8+ |
| KI23 | 0.2–0.4 | 17 | 6.8 | — | Sternocostal part pectoralis major 4.3+ | internal intercostal muscle 21+ |
| KI24 | 0.2–0.4 | 17 | 6.8 | — | Sternocostal part pectoralis major 5.8+ | fourth costal cartilage 20.3+ |
| KI25 | 0.3–0.4 | 17 | 6.8 | — | Sternocostal part pectoralis major 6.5+ | third costal cartilage 19.6+ |
| KI26 | 0.2–0.4 | 17 | 6.8 | empty | — | Sternocostal part pectoralis major 7–21.3 |
| KI27 | 0.2–0.4 | 17 | 6.8 | empty | — | Sternocostal part pectoralis major 11.9–20.1 |
| PC1 | 0.2–0.3 | 17 | 5.1 | — | Sternocostal part pectoralis major 3.1+ | — |
| PC2 | 0.3–0.5 | 20 | 10 | — | Long head biceps brachii 7.1+ | — |
| PC3 | 0.5–1 | 20 | 20 | — | brachialis 19.2+ | — |
| PC4 | 0.5–1 | 22.4 | 22.4 | — | flexor carpi radialis 1.5–6; flexor digitorum superficialis 6.1–12.6; flexor digitorum profundus 13.3–29.4 | ulna 29.9+ |
| PC5 | 0.5–1 | 22.4 | 22.4 | — | flexor carpi radialis 0.5–2.1; flexor digitorum superficialis 3.2–8.5; flexor digitorum profundus 8.7–19.2; Interosseous membrane forearm 22.4–25.6 | extensor pollicis brevis 25.8–33.9 |
| PC6 | 0.5–1 | 22.4 | 22.4 | — | flexor digitorum superficialis 3.4–6.1; flexor digitorum superficialis 3.6–7.6; flexor digitorum profundus 7.8–11.1; pronator quadratus 11.3–18.9 | extensor pollicis brevis 29–33.6 |
| PC7 | 0.3–0.5 | 18.3 | 9.1 | empty | — | flexor digitorum profundus 10.3–11.8 |
| PC8 | 0.3–0.5 | 18.3 | 9.1 | hazard | Set of lumbricals hand 6.8–10; Set of palmar digital veins hand 6.8–8.2 | Set of dorsal interossei hand 17.7–19.5 |
| PC9 | 0.1–0.2 | 18.3 | 3.7 | empty | — | — |
| TE1 | 0.1–0.2 | 18.3 | 3.7 | bone, hazard | Set of dorsal digital arteries 2.1–2.6; Middle phalanx ring finger 2.6–6.2 | flexor digitorum profundus 8.7–10 |
| TE2 | 0.3–0.5 | 18.3 | 9.1 | hazard | Set of dorsal digital arteries 4.3–5.3; Set of dorsal interossei hand 5–8.6 | palmaris longus 19.9–21.2 |
| TE3 | 0.3–0.5 | 18.3 | 9.1 | — | Set of dorsal interossei hand 3.5–7 | Common palmar digital branches of ulnar nerve 11–11.9 |
| TE4 | 0.3–0.5 | 22.4 | 11.2 | — | extensor digitorum 7.8–10.4 | — |
| TE5 | 0.5–1 | 22.4 | 22.4 | — | extensor digitorum 11.3–14.5; extensor pollicis longus 15.3–18 | Interosseous membrane forearm 25.9–28.9 |
| TE6 | 0.5–1 | 22.4 | 22.4 | — | extensor pollicis longus 17.9–27 | extensor pollicis brevis 27.3–29.2 |
| TE7 | 0.5–0.9 | 22.4 | 20.2 | — | extensor digiti minimi 12.6–17.1; extensor pollicis longus 18.6–28.6 | extensor pollicis brevis 28.7–29.5 |
| TE8 | 0.5–1 | 22.4 | 22.4 | — | extensor digitorum 11.3–16.3; abductor pollicis longus 16.7–26.4 | extensor pollicis brevis 27.7–29.5 |
| TE9 | 0.5–1 | 22.4 | 22.4 | — | extensor carpi ulnaris 20–28.4 | abductor pollicis longus 31+ |
| TE10 | 0.3–0.5 | 20 | 10 | empty | — | Long head triceps brachii 19.7+ |
| TE11 | 0.3–0.5 | 20 | 10 | empty | — | Long head triceps brachii 19.2+ |
| TE12 | 0.3–0.7 | 20 | 14 | empty | — | Long head triceps brachii 16.7+ |
| TE13 | 0.5–1 | 20 | 20 | — | Spinal part deltoid 9.3–34.7 | — |
| TE14 | 0.5–1 | 20.2 | 20.2 | — | Spinal part deltoid 8.7–28.3 | teres minor 33+ |
| TE15 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Transverse part trapezius 12.3–23.1 |
| TE16 | 0.3–0.5 | 18.3 | 9.1 | empty | — | splenius capitis 14.1–16.9 |
| TE17 | 0.5–1 | 18.3 | 18.3 | bone | temporal bone 13+ | — |
| TE18 | 0.1–0.2 | 18.3 | 3.7 | empty | — | temporalis 4–4.5 |
| TE19 | 0.1–0.2 | 18.3 | 3.7 | bone | temporalis 0.7–1.6; temporal bone 2–5.1 | middle temporal gyrus 6–9.2 |
| TE20 | 0.1–0.2 | 18.3 | 3.7 | bone | parietal bone 0.9–3.6 | middle temporal gyrus 6.8+ |
| TE21 | 0.3–0.5 | 18.3 | 9.1 | bone | temporalis 3.5–5.8; temporal bone 5.8–9.5 | inferior temporal gyrus 14.9+ |
| TE22 | 0.1–0.2 | 18.3 | 3.7 | empty | — | temporalis 4.4–6.9 |
| TE23 | 0.2–0.3 | 18.3 | 5.5 | bone | Palpebral part orbicularis oculi 1.8–3.3; Frontal bone 3.5–8.4 | — |
| GB1 | 0.2–0.3 | 18.3 | 5.5 | — | Orbital part orbicularis oculi 0.8–2.6 | Check ligament lateral rectus 6.3–10 |
| GB2 | 0.3–0.5 | 18.3 | 9.1 | bone | temporal bone 6.9–20.8 | — |
| GB3 | 0.2–0.3 | 18.3 | 5.5 | empty | — | temporalis 13.2–16 |
| GB4 | 0.2–0.3 | 18.3 | 5.5 | — | temporalis 5.2–11.5 | Sphenoid bone 11.4–15.5 |
| GB5 | 0.2–0.3 | 18.3 | 5.5 | — | temporalis 3.9–8.5 | parietal bone 8.5–12.6 |
| GB6 | 0.2–0.3 | 18.3 | 5.5 | — | temporalis 5.3–8.5 | temporal bone 8–11.3 |
| GB7 | 0.2–0.3 | 18.3 | 5.5 | bone | temporalis 3.9–5.1; temporal bone 5.3–8.6 | middle temporal gyrus 10.8–18 |
| GB8 | 0.2–0.3 | 18.3 | 5.5 | bone | temporalis 1.3–3; parietal bone 3.1–6.7 | artery of central sulcus 8.5–9.7 |
| GB9 | 0.2–0.3 | 18.3 | 5.5 | bone | temporalis 2.1–2.8; parietal bone 2.9–7.3 | supramarginal gyrus 9.3+ |
| GB10 | 0.2–0.3 | 18.3 | 5.5 | bone | temporalis 3.3–4.1; parietal bone 4.6–7.6 | Posterior part superior temporal gyrus 11.3+ |
| GB11 | 0.2–0.3 | 18.3 | 5.5 | bone | parietal bone 5.5–13.1 | inferior temporal gyrus 18.4+ |
| GB12 | 0.2–0.3 | 18.3 | 5.5 | empty | — | sternocleidomastoid 6.4–9.1 |
| GB13 | 0.2–0.3 | 18.3 | 5.5 | — | Aponeurosis of epicranius 4–5.9 | Frontal bone 6.6–11.6 |
| GB14 | 0.2–0.3 | 18.3 | 5.5 | bone | Frontal bone 5.3–11.4 | — |
| GB15 | 0.2–0.3 | 18.3 | 5.5 | — | Aponeurosis of epicranius 3.5–3.7 | Frontal bone 5.7–9.8 |
| GB16 | 0.2–0.3 | 18.3 | 5.5 | — | Aponeurosis of epicranius 4.1–6.7 | Frontal bone 6.7–12.2 |
| GB17 | 0.2–0.3 | 18.3 | 5.5 | — | Aponeurosis of epicranius 3.9–7 | parietal bone 6.9–10.9 |
| GB18 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 1.4–3.9; parietal bone 4–8.5 | precentral gyrus 10.3–19.5 |
| GB19 | 0.2–0.3 | 18.3 | 5.5 | empty | — | Occipital bone 8.1–13 |
| GB20 | 0.3–1 | 18.3 | 18.3 | bone | semispinalis capitis 7.9–10; obliquus capitis superior 9.3–12; Occipital bone 11.6–17.2 | Cerebellum 29.2+ |
| GB21 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Descending part trapezius 13–21.1 |
| GB22 | 0.2–0.3 | 20 | 6 | empty | — | — |
| GB23 | 0.2–0.3 | 17 | 5.1 | empty | — | — |
| GB24 | 0.3–0.5 | 17 | 8.5 | empty | — | external oblique 8.8–13.8 |
| GB25 | 0.3–0.5 | 20.2 | 10.1 | empty | — | external oblique 15.4–21.4 |
| GB26 | 0.5–0.8 | 22.3 | 17.8 | — | external oblique 10.6–18.2 | internal oblique 24.5–29.2 |
| GB27 | 0.5–0.8 | 29.7 | 23.8 | — | internal oblique 14.8–19.4; transversus abdominis 20.2–26.9 | — |
| GB28 | 0.5–0.8 | 22.3 | 17.8 | empty | — | sartorius 31.4+ |
| GB29 | 0.5–1 | 22.3 | 22.3 | — | iliotibial tract 2.9–5; tensor fasciae latae 6.2–12 | — |
| GB30 | 1–2 | 22.3 | 44.5 | — | gluteus maximus 22.5–40.8 | quadratus femoris 51.2–65.9 |
| GB31 | 0.5–1.5 | 22.3 | 33.4 | — | iliotibial tract 10.8–13.8; vastus lateralis 22.8–48.7 | — |
| GB32 | 0.5–1 | 22.3 | 22.3 | — | iliotibial tract 3–6.1; vastus lateralis 16.6+ | — |
| GB33 | 0.3–0.5 | 23.8 | 11.9 | empty | — | Long head biceps femoris 13.2–17.1 |
| GB34 | 0.8–1.2 | 22.3 | 26.7 | — | extensor digitorum longus 21.1–25 | Interosseous membrane leg 31.9–33 |
| GB35 | 0.3–0.8 | 23.8 | 19 | bone | fibularis longus 8.8–11.7; fibula 16.9–27 | flexor hallucis longus 25.7+ |
| GB36 | 0.3–0.8 | 23.8 | 19 | bone | extensor digitorum longus 14.2–17; fibula 16.8–27.9 | flexor hallucis longus 26.1+ |
| GB37 | 0.5–0.9 | 23.8 | 21.4 | bone, hazard | extensor digitorum longus 6.4–11.7; Superficial fibular nerve 10.5–11.2; fibula 13.5–15.9; extensor hallucis longus 14.1–14.2; flexor hallucis longus 17.5–35.8; Interosseous membrane leg 18.4–21.1 | tibialis posterior 28.4+ |
| GB38 | 0.3–0.7 | 23.8 | 16.7 | bone | extensor digitorum longus 5.4–9.2; fibula 10.2–12.1; Interosseous membrane leg 15.6–18.4 | flexor hallucis longus 18–31.1 |
| GB39 | 0.3–0.5 | 23.8 | 11.9 | bone | fibula 4.7–14.6 | flexor hallucis longus 18.8+ |
| GB40 | 0.3–0.5 | 28.6 | 14.3 | — | extensor digitorum longus 5.5–7; extensor hallucis brevis 11.9–17.2 | Navicular bone foot 16.8+ |
| GB41 | 0.3–0.5 | 28.6 | 14.3 | bone, hazard | Dorsal metatarsal veins foot 2.7–3.5; third metatarsal bone 11.3–15 | third metatarsal bone 19.3–24.8 |
| GB42 | 0.1–0.4 | 28.6 | 11.5 | empty | — | — |
| GB43 | 0.2–0.3 | 28.6 | 8.6 | empty | — | — |
| GB44 | 0.1–0.2 | 28.6 | 5.7 | empty | — | extensor digitorum longus 6.3–6.7 |
| LR1 | 0.1–0.2 | 28.6 | 5.7 | empty | — | Distal phalanx big toe 9–10.4 |
| LR2 | 0.2–0.3 | 28.6 | 8.6 | empty | — | Proximal phalanx big toe 10.2–11.6 |
| LR3 | 0.3–0.5 | 28.6 | 14.3 | empty | — | — |
| LR4 | 0.3–0.5 | 23.8 | 11.9 | — | tibialis anterior 11.3–11.8 | talus 19.4+ |
| LR5 | 0.3–0.5 | 23.8 | 11.9 | bone | tibia 8.3–20.8 | flexor digitorum longus 18.4–26.8 |
| LR6 | 0.3–0.5 | 23.8 | 11.9 | bone | tibia 7.3–25.9 | flexor digitorum longus 23.8–25.3 |
| LR7 | 0.3–0.6 | 23.8 | 14.3 | — | semitendinosus 3.2–8.4 | tibia 14.7+ |
| LR8 | 0.3–0.8 | 22.3 | 17.8 | — | semitendinosus 0.6–5.6 | femur 22.1–29.1 |
| LR9 | 0.5–0.7 | 22.3 | 15.6 | — | sartorius 0–1.2; adductor magnus 13.2–30.5 | femoral artery 28.9+ |
| LR10 | 0.5–1 | 29.7 | 29.7 | empty | — | pectineus 34.9+ |
| LR11 | 0.3–0.7 | 29.7 | 20.8 | hazard | femoral artery 17.8–21.9 | pectineus 28.4+ |
| LR12 | 0.3–0.5 | 29.7 | 14.9 | empty | — | external oblique 24.2–25.2 |
| LR13 | 0.5–0.8 | 17 | 13.6 | empty | — | external oblique 15.1–20.1 |
| LR14 | 0.2–0.3 | 17 | 5.1 | — | Abdominal part pectoralis major 3.2–8.5 | external oblique 6.2–7.9 |
| GV1 | 0.3–0.5 | 20.2 | 10.1 | empty | — | gluteus maximus 16.7–24.6 |
| GV2 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Sacrum 19.1+ |
| GV3 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Left latissimus dorsi 16–17.5 |
| GV4 | 0.3–0.5 | 20.2 | 10.1 | empty | — | latissimus dorsi 13.2–15.9 |
| GV5 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Supraspinous ligament 22.3–22.8 |
| GV6 | 0.3–0.5 | 20.2 | 10.1 | — | Ascending part trapezius 9.8–12.8; Ascending part of left trapezius 9.8–12.5 | serratus posterior inferior 15.4–16.2 |
| GV7 | 0.3–0.5 | 20.2 | 10.1 | — | Ascending part trapezius 1.7–7.3; Ascending part of left trapezius 2.1–7.5; Supraspinous ligament 9.6–9.7 | Eleventh thoracic vertebra 20+ |
| GV8 | 0.3–0.5 | 20.2 | 10.1 | — | Ascending part trapezius 1.5–6.1; Ascending part of left trapezius 1.5–6; Supraspinous ligament 8–8.5 | Tenth thoracic vertebra 18.6+ |
| GV9 | 0.3–0.5 | 20.2 | 10.1 | — | Ascending part of left trapezius 7–12.9 | Left latissimus dorsi 12.7–17.4 |
| GV10 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Ascending part trapezius 11.3–19.1 |
| GV11 | 0.3–0.5 | 20.2 | 10.1 | — | multifidus 10.1–10.3 | splenius cervicis 13–15.8 |
| GV12 | 0.3–0.5 | 20.2 | 10.1 | — | Ascending part of left trapezius 8.6–13.3 | Ascending part trapezius 10.5–14 |
| GV13 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Transverse part trapezius 13.3–16 |
| GV14 | 0.3–0.5 | 20.2 | 10.1 | empty | — | Transverse part of left trapezius 11.9–15.7 |
| GV15 | 0.3–0.5 | 18.3 | 9.1 | empty | — | Descending part of left trapezius 17.9+ |
| GV16 | 0.3–0.5 | 18.3 | 9.1 | bone | Occipital bone 4.3–13.7 | — |
| GV17 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 1.7–2.6; Occipital bone 2.6–8.8 | — |
| GV18 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 2.7–4.8; Occipital bone 4.7–10.8 | — |
| GV19 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 2.8–4.4; parietal bone 4.7–9.9 | — |
| GV20 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 0–1.4; Left parietal bone 1.7–5.4 | — |
| GV21 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 1.5–2.9; Left parietal bone 3.1–8.2 | — |
| GV23 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 1.4–3.4; Frontal bone 3.7–8.4 | — |
| GV24 | 0.2–0.3 | 18.3 | 5.5 | bone | Aponeurosis of epicranius 1.2–3.3; Frontal bone 3.4–7.3 | — |
| GV25 | 0.1–0.2 | 18.3 | 3.7 | empty | — | — |
| GV26 | 0.2–0.3 | 18.3 | 5.5 | empty | — | Orbicularis oris 11.6–13.6 |
| GV27 | 0.1–0.3 | 18.3 | 5.5 | — | Orbicularis oris 3.9–9.3 | Gingiva of upper jaw 8.4–19.6 |
| GV28 | 0.1–0.2 | 18.3 | 3.7 | bone | Orbicularis oris 0–0.7; Gingiva of upper jaw 0.3–5.3; Left upper central secondary incisor tooth 1.9–2.7 | — |
| CV1 | 0.3–1 | 20.2 | 20.2 | empty | — | — |
| CV2 | 0.5–1 | 29.7 | 29.7 | empty | — | Linea alba 36.9–37.9 |
| CV3 | 0.5–1 | 29.7 | 29.7 | empty | — | Linea alba 33.5–34.7 |
| CV4 | 0.5–1 | 29.7 | 29.7 | empty | — | Linea alba 30–30.6 |
| CV5 | 0.5–1 | 29.7 | 29.7 | — | Linea alba 24–27.5 | Proximal part of ileum 29.9–42.8 |
| CV6 | 0.5–1 | 29.7 | 29.7 | hazard | Linea alba 22.9–26.9; Proximal part of ileum 28.7–38.9 | Proximal part of ileum 32.9–40.7 |
| CV7 | 0.5–1 | 29.7 | 29.7 | hazard | Linea alba 21.4–25.5; Distal part of jejunum 27.2–33.5; Distal part of jejunum 27.2–40.2 | — |
| CV9 | 0.5–1 | 29.7 | 29.7 | hazard | Linea alba 13.7–16.2; Distal part of jejunum 25.9+ | Mesentery of small intestine 46.5+ |
| CV10 | 0.5–1 | 29.7 | 29.7 | hazard | Linea alba 15.4–18; Transverse colon 20+ | — |
| CV11 | 0.5–1 | 29.7 | 29.7 | — | Linea alba 15.1–17.1 | gastro-epiploic artery 36.7–37.8 |
| CV12 | 0.5–1 | 29.7 | 29.7 | hazard | Linea alba 13.7–15.7; Stomach 27+ | — |
| CV13 | 0.5–1 | 17 | 17 | — | Linea alba 12.1–14.4 | Hepatovenous segment III 19.5–30 |
| CV15 | 0.3–0.5 | 17 | 8.5 | bone | Xiphoid process 3.7–4.3; Linea alba 6.9–9.2 | — |
| CV16 | 0.2–0.3 | 17 | 5.1 | bone | Body of sternum 0–13 | — |
| CV17 | 0.3–0.5 | 17 | 8.5 | bone | Body of sternum 3.8–19.4 | — |
| CV18 | 0.2–0.3 | 17 | 5.1 | bone | Body of sternum 2.3+ | — |
| CV19 | 0.2–0.3 | 17 | 5.1 | bone | Body of sternum 3.4–17.3 | — |
| CV20 | 0.2–0.3 | 17 | 5.1 | bone | Manubrium 2.4–18.4 | — |
| CV21 | 0.2–0.3 | 17 | 5.1 | bone | Manubrium 2.1+ | — |
| CV22 | 0.3–0.5 | 17 | 8.5 | empty | — | — |
| CV23 | 0.2–0.3 | 18.3 | 5.5 | — | Left platysma 5–7.5 | Left mylohyoid 18.9+ |
| CV24 | 0.2–0.3 | 18.3 | 5.5 | empty | — | Orbicularis oris 7.9–8.8 |
