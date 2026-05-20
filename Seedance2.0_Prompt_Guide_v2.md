# Seedance 2.0 プロンプト設計ガイド 改訂版

> **基本思想：プロンプトは「絵の説明」ではなく「撮影指示書」として書く。**
> エンジニアではなく、監督の視点で書くこと。

---

## 0. Seedance 2.0 の基本仕様

- 最大入力：画像9枚 + 動画3本 + 音声3本 + テキストプロンプト
- 最大出力：15秒 / 2K解像度 / ネイティブ音声付き
- @参照システム：`@Image1` `@Video1` `@Audio1` で各素材の役割を明示
- DiTアーキテクチャにより物理シミュレーション精度が高い（重力・衝突・布挙動）
- ネガティブプロンプト非対応（`Avoid` で正方向から制約する）

---

## 1. 公式6ステップ構造

Seedance 2.0のプロンプトは以下の順序で構成する。推奨語数は **35〜100語**。長すぎると矛盾が生じ品質低下する。

```
[Subject] → [Action] → [Environment] → [Camera] → [Style] → [Constraints]
```

| ステップ | 内容 | 書き方 |
|---|---|---|
| **Subject** | 誰・何が映るか | 具体的な外見特徴を優先。「A young woman」ではなく「A young woman in a white dress with short silver hair」 |
| **Action** | 何が起きるか | 現在形の具体動詞1つ。動きの強度も書く。「slowly turns around, breeze lifting the hem of her skirt」 |
| **Environment** | どこで起きるか | 場所＋照明＋空気感。「in a quiet rainy alley at night, neon reflections on wet asphalt」 |
| **Camera** | どう撮るか | 主カメラ指示は**1つだけ**。「camera slow push-in」 |
| **Style** | どんな映像感か | 具体的な映像参照。「cinematic film tone, 35mm, warm」 |
| **Constraints** | 何を避けるか | 具体的に排除。「avoid jitter, bent limbs, identity drift」 |

### 悪い例 vs 良い例

```
❌ cool skateboard video, cinematic, fast, amazing tricks, lots of movement, epic style

✅ A skateboarder lands a clean trick in an empty dawn parking lot,
   camera low tracking shot then subtle rise, modern cinematic contrast,
   6 seconds, 16:9, avoid jitter and bent limbs.
```

---

## 2. カメラ指示の3大ルール（最重要）

カメラワークは **動画品質に最も直接的に効くプロンプト要素**。この3つを守れば安定度が劇的に上がる。

### ルール1：主カメラ指示は1つだけ

```
✅ camera slow push-in
❌ camera push-in, then pan left, zoom out, orbit around
```

複数のカメラ指示を同時に入れるとジッター・破綻の原因になる。複合動作が必要な場合は主動作＋従動作の順序で書く。

```
✅ camera low tracking shot then subtle rise
```

### ルール2：リズム語で書く、技術パラメータは使わない

```
✅ slow, smooth, stable, gradual, gentle
❌ 24fps, f/2.8, ISO 800, focal length 85mm
```

Seedance 2.0は人間的なリズム記述を理解する。「編集マンに話しかけるように書け」が公式の指針。

### ルール3：カメラ動作と被写体動作を分離する

```
✅ The dancer spins slowly. Camera holds fixed framing.
❌ spinning camera around a dancing person
```

混同すると制御不能な映像になる。「何が動いているのか」を明確に区別する。

---

## 3. カメラワーク辞典

### 基本8タイプ（公式対応）

| カメラタイプ | 英語指示 | 効果 | 向いている場面 |
|---|---|---|---|
| **Push-in** | push-in, dolly in | 被写体に寄る→緊張・親密・集中 | 表情、決意、感情的ビート |
| **Pull-out** | pull-out, dolly out | 引いて世界を見せる→孤独・状況把握 | ラストショット、環境見せ |
| **Pan** | pan left/right, lateral motion | 水平移動→発見・空間説明 | 風景、群衆、商品棚 |
| **Tracking** | tracking shot, follow | 被写体を追従→行動の連続性 | 歩行、走行、戦闘 |
| **Orbit** | orbit, arc, circle | 被写体を周回→立体感・ヒーロー感 | キャラ紹介、商品紹介 |
| **Aerial** | aerial, drone shot | 空撮→スケール感・俯瞰 | 風景、都市、戦場 |
| **Handheld** | handheld | 微振動→臨場感・リアリズム | ドキュメンタリー、戦場、UGC |
| **Fixed** | fixed, locked-off | 完全静止→品格・被写体の動きに集中 | 商品、美術、静かな芝居 |

### 拡張カメラワーク（実戦で有効確認済み）

| カメラワーク | 英語指示 | 効果 | 備考 |
|---|---|---|---|
| **Tilt** | tilt up/down | 縦移動→威圧・発見 | ブーツから顔へ、建造物を見上げる |
| **Truck/Slide** | truck left/right, slide | 横方向の物理移動→パララックス | 商品、横顔、室内 |
| **Crane** | crane up/down | 垂直移動→ダイナミックな高低差 | 戦場俯瞰、キャラ登場 |
| **Zoom** | zoom in/out | 光学ズーム→緊張・開放 | Push-inとは異なる圧縮感 |
| **Whip Pan** | whip pan | 超高速横移動→場面転換・衝撃 | MV、ショート動画、アクション |
| **Hitchcock Zoom** | dolly out while zooming in | めまい効果→不安・異変 | ホラー、サスペンス。複合動作として認識される |
| **Steadicam** | steadicam, smooth tracking | 安定した追従→プロフェッショナル感 | 長回し風、探索 |
| **POV** | POV shot, first-person | 一人称→没入感 | ホラー、ゲーム風、Orb系 |
| **Over-the-shoulder** | over-the-shoulder | 背越しショット→会話・視線誘導 | 対話、発見 |
| **Dutch Angle** | dutch angle | 傾斜→不安・不穏 | サスペンス、ホラー、サイコ |
| **Snap Zoom** | snap zoom | 瞬間ズーム→衝撃・強調 | アクション、コメディ |

### カメラ速度キーワード

| 速度 | キーワード | 注意 |
|---|---|---|
| 超低速 | imperceptible, barely | ほぼ気づかない動き |
| 低速 | slow, gentle, gradual | 安定・映画的 |
| 中速 | smooth, controlled | 自然な動き |
| 高速 | dynamic, swift | **品質低下リスク高**。高速はカメラ・被写体・カットのうち**1要素だけ**に限定 |

> ⚠️ `fast` は品質破壊ワード。高速カメラ＋高速被写体＋複雑シーンの同時指定はジッター確定。

### カメラモデル名の活用

具体的なカメラモデル名を指定すると、そのカメラ特有の映像美学が反映される。

```
Sony Venice        → 映画的トーン、深い色彩
ARRI ALEXA         → ハイエンド映画、自然な肌色
Sony A7S3          → ドキュメンタリー風、低光量に強い感じ
anamorphic lens    → 横長ボケ、特有のレンズフレア
```

例：`style cinematic film tone, shot with ARRI ALEXA, anamorphic lens`

---

## 4. ショットサイズと視点

| ショットサイズ | 英語 | 用途 |
|---|---|---|
| エクストリームワイド | extreme wide shot | 世界観確立、孤独感 |
| ワイド | wide shot, establishing shot | 場面導入、位置関係 |
| フル | full shot | 全身、衣装見せ |
| ミディアム | medium shot | 標準的な会話・行動 |
| ミディアムクローズアップ | medium close-up | 表情＋上半身 |
| クローズアップ | close-up | 表情、感情 |
| エクストリームクローズアップ | extreme close-up, macro | 目、指先、質感、商品ディテール |

---

## 5. ライティング（最もレバレッジの高い要素）

プロンプトに追加する要素を1つだけ選ぶなら、**ライティング記述**が最も効果がある。

| ライティング | 英語 | 効果 |
|---|---|---|
| ゴールデンアワー | golden hour, soft golden hour lighting | 暖色、美しい自然光 |
| リムライト | rim light, dramatic rim light | 被写体の輪郭強調 |
| バックライト | backlit, backlight silhouette | シルエット、神秘感 |
| ネオン | neon-lit | サイバーパンク、夜景 |
| 自然光 | natural light, soft window light | リアリズム、穏やかさ |
| 曇天 | overcast, diffused light | 均一な柔光 |
| ソフトボックス | softbox reflections | 商品撮影、スタジオ感 |
| ボリュメトリック | volumetric light, god rays | 神秘・奥行き・森・教会 |

---

## 6. スタイルキーワード

| カテゴリ | キーワード | 効果 |
|---|---|---|
| 映画的 | cinematic, film tone, 35mm | クラシック映画 |
| 高精細 | 4K, high detail, sharp, 2K resolution | 高解像度 |
| フィルム | film grain, analog, vintage | レトロ質感 |
| トーン | warm tone, cool palette, desaturated | 色偏向 |
| 雰囲気 | moody, dreamy, ethereal | 感情的ムード |
| リアリズム | realistic, natural, documentary | 実写風 |
| アニメ | anime film, clean linework, expressive eyes | アニメ映画風 |
| 商品 | premium commercial look, studio lighting | CM品質 |
| 強制リアリズム | no 3D, no cartoon, no VFX | CG感を消してウルトラリアリズムに寄せる |

---

## 7. エフェクト辞典

### 映像エフェクト

| エフェクト | 英語 | 効果 | 使いどころ |
|---|---|---|---|
| 被写界深度 | shallow depth of field | 主役分離・映画感 | 顔、商品、手元 |
| ラックフォーカス | rack focus | 視線誘導 | 手→顔、前景→背景 |
| モーションブラー | motion blur | 速度感 | 走り、剣撃、カメラ移動 |
| ボリュメトリックライト | volumetric light, god rays | 神秘・奥行き | 森、教会、窓辺 |
| ミスト・霧 | mist, fog, haze | 空気感 | ファンタジー、ホラー |
| 雨・ウェットリフレクション | rain, wet reflections | 高級感・夜景映え | 都市、ドラマ、MV |
| 陽光の中の塵 | dust in sunlight | 実写感 | 廃墟、室内、朝日 |
| 火花・残り火 | sparks, embers | 危険・熱量 | 戦闘、鍛冶、炎 |
| 発光エッジ | glowing edges | SF・魔法感 | 武器、魔法陣 |
| 光スウィープ | light sweep, highlight sweep | 商品感 | ロゴ、金属、ガラス |
| フィルムグレイン | film grain | 質感・シネマ感 | レトロ、ドラマ |
| アナモフィックフレア | anamorphic flare | 映画的光 | SF、夜景（使いすぎ注意） |
| ヒートシマー | heat shimmer | 熱気・砂漠感 | 砂漠、夏、ロードムービー |

### トランジション・タイミング系

| エフェクト | 英語 | 効果 | 備考 |
|---|---|---|---|
| スピードランプ | speed ramp, slow-motion | 緩急→アクション演出 | ジャンプ、斬撃、着地 |
| ウィップパントランジション | whip pan transition | 超高速場面転換 | ショート動画、MV |
| マッチカット | match cut | 編集感・プロ感 | 同じ形・動作でつなぐ |
| フリーズフレーム | freeze frame | 劇的停止 | ラスト、タイトル前 |
| 残像 | afterimages | 超高速動作の視覚化 | 格闘、剣撃、超能力 |

### VFXインライン記法

アクション記述の中にVFXを直接埋め込む手法。Seedance 2.0がVFXの見た目を被写体の動作と分離して処理できる。

```
He slams his fist into the ground [VFX: branching electric circuits pulsing
with white-blue current radiate outward from impact point].
```

---

## 8. @参照システム（2.0最大の特徴）

### 参照の階層

| 参照タイプ | 役割 | 優先度 |
|---|---|---|
| **@Audio** | リズムアンカー：リップシンク、ビートマッチ、編集テンポ | テンポ基準 |
| **@Video** | 動きアンカー：モーション軌道、カメラワーク転写 | 動き基準 |
| **@Image** | 見た目アンカー：顔（Face ID）、衣装、スタイル | 外見基準 |

### 使い方

```
Reference @Image1 for the character's face, hairstyle, and costume.
Reference @Video1 for the camera movement rhythm.
Reference @Audio1 for pacing and emotional tone.
```

### ベストプラクティス

- **2〜3素材から始める**。多ければ良いわけではない。
- @Image は**シンプル構図のバストアップ**が最も安定する。
- @Video から転写できるもの：カメラワーク、アクション振付、編集リズム、Hitchcock zoomなどの特殊技法
- @Audio は**15秒以内、リバーブの少ないクリアな音源**が精度高い

### モード別プロンプトの差異

| 要素 | Text-to-Video | Image-to-Video |
|---|---|---|
| 被写体描写 | 詳細に書く | 画像に含まれるので省略可 |
| 動き描写 | 全部書く | **動きに集中**（これが最重要） |
| 構図保持 | 不要 | 「preserve composition」を明示 |
| カメラ | 自由 | 画像構図と矛盾しない動きを選ぶ |

Image-to-Video では**画像に見えているものを再記述しない**。プロンプトのトークンは全て「動き・カメラ・感情変化」に使う。

---

## 9. テンプレート集

### A. 基本テンプレート（コンテなし・雰囲気重視）

最も汎用性が高い型。1ショットの美しさを追求する場合に使う。

```
[Subject], [appearance / costume / key traits].
[Action: single main action, emotional progression].
Set in [location], [time], [weather / atmosphere].
Camera [one primary camera movement], [shot size].
Style: [visual reference], [lighting], [lens feel], [color grade].
[duration], [aspect ratio].
Avoid [specific negative constraints].
```

**例：雰囲気重視MV風**

```
A young woman in a matte black futuristic coat, silver short hair, calm expression.
She slowly turns her face toward the camera as rain falls naturally.
Her coat moves subtly in the wind. The mood shifts from mysterious to confident.
Set in a quiet rainy Tokyo alley at night, neon reflections on wet asphalt.
Camera slow push-in from medium close-up, slight handheld feel.
Style: photorealistic music video, soft neon rim light, shallow depth of field,
35mm lens feel, cool blue and magenta color grading.
8 seconds, 9:16.
Avoid distorted hands, unstable face, excessive lens flare, flickering,
overexposed neon, random background people.
```

### B. マルチショット（秒指定あり）

```
Create a [duration]-second [format] video, [aspect ratio].
Keep the same subject identity, outfit, lighting, and style throughout.

0.0s–[x]s: [Shot 1: subject, action, camera, emotion]
[x]s–[y]s: [Shot 2: transition, camera change]
[y]s–[z]s: [Shot 3: climax / hero frame]

Final frame: [exact composition].
Style: [global style rules].
Avoid: [constraints].
```

**例：8秒キャラPV**

```
Create an 8-second cinematic anime-style character reveal, 16:9.
Keep the same character identity, hairstyle, costume, and lighting throughout.

0.0s–2.0s: Wide shot. A lone female warrior stands in a ruined glass city at dawn.
Her long white coat moves gently in the wind. Camera slowly tracks forward from behind.
2.0s–4.5s: Medium side shot. She turns her head, revealing one glowing blue eye.
Glass on the ground reflects the sunrise. Motion is slow and controlled.
4.5s–6.5s: Close-up. Her hand tightens around the sword handle.
Shallow depth of field, subtle rack focus from fingers to eye.
6.5s–8.0s: Low-angle hero shot. She faces the camera, calm and fearless.
City skyline glows behind her. End on a clean, stable final frame.

Cinematic anime film style, soft sunrise backlight, crisp linework,
controlled motion, dramatic but not chaotic camera.
Avoid extra fingers, changing costume, flickering face, random debris,
excessive glow, excessive particles.
```

### C. コンテ参照テンプレート

```
Use the provided storyboard as the primary shot plan.
Reference instructions:
- @Image1 for storyboard layout and shot order.
- @Image2 for character face, hairstyle, outfit, and color palette.
- @Image3 for background and lighting mood.
- @Video1 for camera rhythm (keep motion smoother and more cinematic).

Create a [duration]-second video, [aspect ratio].
Maintain consistent character identity across all shots.

Shot 1, 0.0s–[x]s: [description]
Shot 2, [x]s–[y]s: [description]
Shot 3, [y]s–[z]s: [description]

Style: [global rules].
Final frame: [composition].
Avoid: [constraints].
```

### D. AIにカメラプランを任せる

「自動で良い感じに」ではなく**演出方針を渡す**。

```
Create a [duration]-second [genre] video.
Automatically plan 3 cinematic shots with clear visual progression:
1. Establish the world.
2. Reveal the subject's emotion or action.
3. End with a strong hero frame.

Subject: [details]
Setting: [details]
Narrative arc: [start mood] → [change] → [end mood]

Camera direction: Use professional cinematic camera language.
Avoid chaotic cuts. Each shot should have a clear purpose.
Style: [lighting, lens, color, mood]
Continuity: Keep subject identity and atmosphere consistent.
Avoid: [constraints].
```

### E. トランスフォーメーション（2.0最高パフォーマンス形式）

Seedance 2.0で最も高い性能を発揮するフォーマット。エスカレーションアーク（平穏→脅威→変身→余波）で構成する。

```
Montage, multi-shot action [genre], cinematic lighting, photorealistic,
35mm film quality, professional color grading, sharp focus,
high detail texture, film grain, depth of field mastery, ARRI ALEXA aesthetic.

[Character description with specific visual details].

Shot 1: [Calm establishment]
Shot 2: [Threat / trigger]
Shot 3: [Transformation begins]
Shot 4: [Full transformation + peak action]
Shot 5: [Climax / destruction]
Shot 6: [Return to calm / aftermath]

[duration], [aspect ratio].
```

### F. Orb（一人称POV連続ショット）

```
Single continuous first-person POV shot, 15 seconds.
Hyper-chaotic handheld motion, never breaking POV.

The viewer has [power / weapon]. [VFX: description of power visuals].
Environment: [location with destruction details].
Enemy: [description].

0–5s: [Initial encounter, power activation]
5–10s: [Escalation, environment destruction]
10–15s: [Final attack, enemy defeat, aftermath]

Photorealistic, cinematic action, practical VFX feel.
Avoid breaking POV, static camera, calm moments.
```

### G. 商品CM

```
Create a [duration]-second premium product commercial, [aspect ratio].
Product: [name, material, shape, color, key features].
The product must remain visually consistent and undistorted.

Shot 1: Macro detail of [feature]. Softbox reflections.
Shot 2: Smooth camera slide revealing product silhouette.
Shot 3: Slow orbit showing reflections and material quality.
Final: Clean centered packshot facing camera.

Controlled studio camera, smooth slider movement, no handheld shake.
Softbox reflections, rim light, subtle highlight sweep, premium commercial look.
Avoid warped logo, unreadable text, changing product shape,
excessive glare, overexposed reflections.
```

---

## 10. ショット構成パターン

### キャラPV
`wide establishing → slow dolly in → close-up → low-angle hero shot`

### 商品CM
`macro detail → smooth slide → slow orbit → clean packshot`

### ホラー
`static wide → slow push-in → handheld close-up → sudden whip pan`

### アクション前の緊張
`low-angle medium → tracking → close-up of hand → fast push-in to eyes`

### AIキャラ紹介
`soft close-up → subtle orbit → hair/cloth motion → centered portrait`

### トランスフォーメーション
`calm establishment → trigger → transformation → peak action → aftermath → return to calm`

---

## 11. ネガティブ制約チェックリスト

用途に応じて組み合わせる。全部入れる必要はない。

### 常時使用（全動画共通）

```
Avoid jitter, temporal flicker, unstable camera.
```

### キャラ動画

```
Avoid bent limbs, extra fingers, warped hands, changing face,
changing outfit, flickering eyes, identity drift,
random background characters.
```

### 商品動画

```
Avoid warped logo, unreadable text, changing product shape,
random objects, excessive glare, overexposed reflections.
```

### アクション

```
Avoid chaotic cuts, broken spatial continuity,
unmotivated camera moves, confusing character positions.
```

### 長尺・マルチショット

```
Avoid costume drift, changing hairstyle, inconsistent lighting direction,
breaking scene geography.
```

---

## 12. プロ品質に近づける書き方ルール

### 1. カメラワークは「動き＋目的」で書く

```
❌ cool camera movement, cinematic
✅ The camera slowly pushes in from medium shot to close-up,
   emphasizing her hesitation before she smiles.
```

### 2. 被写体同一性を毎回ロックする

```
Keep the same face, hairstyle, outfit, body proportions,
color palette, and character identity throughout all shots.
```

### 3. 最終フレームを必ず指定する

```
End on a clean, stable final frame: centered close-up portrait,
eyes facing the camera, soft backlight, no motion blur.
```

### 4. 1プロンプトに1つの主役

複数キャラ、複数行動、複数エフェクト、複数カメラを同時に入れるほど崩れる。**1ショット＝1主役＝1演出意図**。

### 5. 失敗時は1変数だけ変える

全書き換えではなく、カメラ・被写体動作・ライティングのうち**1つだけ**変更して再生成。どの指示が結果に影響したか追跡する。

### 6. 「no 3D, no cartoon, no VFX」でリアリズム強制

モンスターやクリーチャーがCG臭くなる場合に有効。質感がフォトリアルに寄る。

### 7. コメディのビジュアルギャグ

```
add a visual gag in the background
```

と書くだけでSeedanceが背景にギャグを発明してくれる（コメディ限定テクニック）。

---

## 13. 秒数指定の使い分け判断基準

### 秒指定すべき場合

- 商品の登場タイミングが重要
- キャラの変身・武器展開・表情変化を順序立てて見せたい
- 音楽・効果音・台詞と同期したい
- 広告・PV・予告編の構成を固定したい
- 最終フレームをサムネ・キービジュアルに使いたい

### 秒指定しない方がよい場合

- 雰囲気を探索したい
- 動きの自然さを優先したい
- 1ショットの美しさを追求したい
- キャラの顔・衣装安定性を優先したい
- 抽象的・詩的・幻想的な映像を作りたい

### 実務フロー

```
企画・世界観探索 → 秒指定なし（雰囲気テスト）
      ↓
良い方向性が出たら → 3〜5ビートの秒指定
      ↓
本番素材 → ショット単位で分割生成（3秒・5秒・5秒など）
      ↓
編集ソフト → 尺・音・字幕・色・トランジション調整
```

> AI動画の秒指定は編集タイムラインほど正確ではない。厳密に合わせたいなら分割生成＋編集が確実。

---

## 14. 映画用語クイックリファレンス

プロンプトに映画制作の用語を入れると映像品質が上がる。

| 日本語 | 英語 | 使い方 |
|---|---|---|
| 長回し | long take, oner | 「steadicam long take following...」 |
| ワンショット | single continuous shot | 「single continuous cinematic shot, no cuts」 |
| ジャンプカット | jump cut | 通常は避けるが意図的に使う場合 |
| Lカット・Jカット | L-cut, J-cut | 音と映像のずらし（編集ソフト側で対応） |
| カラーグレーディング | color grading, teal-orange, desaturated | 色調補正の方向性 |
| バタフライライティング | butterfly lighting | 「cinematic butterfly lighting」（顔の美しい影） |
| レンブラントライティング | Rembrandt lighting | 顔の半分に三角形の光 |
| チアロスクーロ | chiaroscuro | 明暗の劇的対比 |
