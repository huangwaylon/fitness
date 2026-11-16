// REVIEW 2026-11-16: pass 5, fix 17, drop 0, new 0; ear checks 0
// “What is it Like Being Single? - The Office US” (the official The Office channel, Best of Season 4): Michael is
// meant to pick a new chair from a catalog but falls for the model sitting in one; Pam, promised his old chair, keeps
// steering him back, and he ends by asking the office to find him a woman like the one on page 85.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 131.4 s (music to the end). Pam is named
// by Michael (6.8 s) and by a coworker (“When Pam gets Michael's old chair”, 105.8 s), which also makes the 15.8 s talking
// head hers (“he promised me his old one”). The single-life answer (76–91 s), the “Is this his new chair?” pair
// (101–104 s), the chair-chain coworker (105–113 s) and the announcements (92 s, 114–131 s; assumed Michael, by
// “page 85”) are never named, so stems say “the answer”, “a coworker” and “the announcement”.
// Untested on purpose: 24–29 s (whisper's “Shh!”, the captions have nothing), 33.4 s (captions “really great”, whisper
// “really gray”: pr1's line and key leave the word out), 37.4 s (captions “so eyes”, whisper “Those eyes”), 49.7 s (who
// says “Or in a great chair”), 58.7 s (“I definitely remember your dinner party”: its point is tone), 96.9–98.9 s
// (whisper's “I'll see you next time. Okay.”, the captions have nothing), 104.6 s (whisper “Dot.”, captions “that”).
// At 107.4 s whisper has “Michael's old chair”, the captions “Michael's chair”, and at 129 s “as a template” / “has a
// template”: no key rests on either.
// No EAR CHECK: every key stands on words both sources share; no key rests on who speaks or on tone alone.
import type { Clip } from '../types.ts';

export const chairModel: Clip = {
  id: 'chairmodel', video: '1mkpb6KV9NM', title: 'What is it Like Being Single? - The Office US', dur: 152, wpm: 137,
  band: 'slow', tags: ['職場', '恋愛'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): the title and two weak distractors left only the key. Both distractors now come from the
    //   scene's own words.
    // why: old chair better ← Pam's "It's way better" heard as Michael finding nothing as good as his old chair; finds
    //   fault ← the long chair description ("mesh, black, high-back swivel") heard as him weighing each chair's flaws
    { id: 'g1', skill: 'gist', level: 'B2', point: 'distract', reveals: ['steer'], seg: [4.0, 75.0],
      stem: 'Why is Michael’s new chair still not chosen?',
      choices: ['He keeps getting drawn to the woman in one photo', 'His old chair is better than any in the catalog',
                'He keeps finding something wrong with each chair'], a: 0,
      cue: 'カタログを開いて、最初に何に目が行ったか。',
      said: 'イスを選ぶはずのカタログで、イスに座る女性モデルばかり見ている。',
      mean: 'イス選びが進まないのは、カタログのモデルに夢中だから。最後は「運命」とまで言う。',
      trap: 'イスの形容が長く続くので、イス選びに迷っていると思いやすい。話の中心が何かを追う。',
      use: 'I got a little distracted.（ちょっと気が散っちゃって）' },

    // R fix: V2 (blind 55 %): "As self-interest" was the only reading the stem's "after… the camera" pointed to. The
    //   stem now asks why, and the choices are three plain motives.
    // why: worried ← "It's been a while" heard as worry for him (the Japanese frame of 気づかい); any late order ←
    //   routine office follow-up, which the talking head rules out ("normally I wouldn't care")
    // anchor: 4.6–6.2 s "Did you pick a new chair? It's been a while." then, to camera, 19.6–27.3 s "normally I wouldn't
    //   care, but he promised me his old one… I really want it": the to-camera words give the opening its motive
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'promise', seg: [4.0, 27.8],
      stem: 'After Pam’s comment to the camera, why did she ask about his chair?',
      choices: ['She is waiting to get his old chair', 'She is worried the job is wearing him out',
                'She would chase any order that runs late'], a: 0,
      cue: '最初の質問と、カメラへの一言を比べて。',
      line: 'Did you pick a new chair? *It’s been a while.* … normally I *wouldn’t care*, but… *I really want it*.',
      said: '「イス決めた？ずいぶん経つけど」と聞き、カメラには「普段は気にしないけど、古いイスが欲しい」と話す。',
      mean: 'カメラへの本音が、直前の場面を書きかえる。気づかいに聞こえた質問は、自分のイスのための催促。',
      trap: '「ずいぶん経つね」は心配に聞こえやすい。この形式では、カメラへの一言が答え合わせ。',
      use: 'Just asking. No real reason.（聞いてみただけ。特に理由はないよ）' },

    // R fix: V2 (blind 75 %) + S3: "tells him off openly" was easy to rule out, and the cue ("the word in every reply")
    //   all but named "chair". New distractors and a cue that says where to listen.
    // why: plays along ← "Her? The one in the…" heard as asking about the woman; gives up ← the usual script (the
    //   assistant takes over), which "you have to pick out a new chair" refutes
    { id: 'g2', skill: 'gist', level: 'C1', point: 'steer', reveals: ['fate', 'instead'], seg: [6.5, 74.6],
      stem: 'Through the scene, how does Pam deal with Michael’s daydreaming?',
      choices: ['She keeps bringing the talk back to chairs', 'She plays along and asks about the woman',
                'She gives up and offers to pick one for him'], a: 0,
      cue: 'パムの返事が毎回どこへ向かうか。',
      said: 'パムは返事のたびに「イスを選ぶ」「イス」と、話をイスに戻す。',
      mean: '怒るのではなく、話題をさりげなく本来の用事へ戻し続けている。理由はマイケルの古いイス。',
      trap: '強い口調がないので付き合っているように見えるが、毎回イスの語で話を戻している。',
      use: 'Anyway, back to the chair.（それはそうと、イスの話に戻ろう）' },

    // R fix: V2 (blind 60 %): the key was the only negative feeling. A second annoyed reading now competes.
    // why: annoyed at the catalog ← "when I first opened this catalog" heard as what bothers her; pleased ← "found
    //   something" heard as good news
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'instead', seg: [9.4, 15.8],
      stem: 'When Pam finishes Michael’s sentence about the catalog, how does she feel?',
      choices: ['Fed up that he still hasn’t picked one', 'Annoyed that he keeps showing her the catalog',
                'Pleased that he found one he really likes'], a: 0,
      cue: 'but のあとの「代わりに」と、ever の一語。',
      line: '*But instead*, you found something to distract you from *ever* picking out a chair.',
      said: '言いかけた文を引き取り、「代わりに、イス選びから気をそらす物を見つけたのね」と言う。',
      mean: 'instead と ever で「いつまでも選ばない」と責めている。',
      trap: 'found something は良い知らせに聞こえるが、後ろの語が向きを決める。',
      use: 'Instead, you’re still on your phone.（なのに、まだスマホ見てるじゃない）' },

    // why: thirteen ← -teen/-ty and three/thirteen run together; days ← "It's been a while" heard but not the unit;
    //   months ← "a while" taken as a long time
    { id: 'n1', skill: 'number', level: 'B1', point: 'weeks', seg: [15.3, 19.4],
      stem: 'How long ago did Michael start choosing a new chair?',
      choices: ['About three days', 'About three weeks', 'About thirteen weeks', 'About three months'], a: 1, keep: true,
      cue: 'about のあとの数と単位。',
      line: 'Michael started the process… *about three weeks ago*',
      said: 'パムがカメラに「マイケルが新しいイスを選び始めたのは3週間ほど前」と話す。',
      mean: '数字は three、単位は weeks。最初の「ずいぶんかかってる」の中身。',
      trap: 'three と thirteen は語尾の長さと強さで分かれる。数字のあとの単位まで聞く。',
      use: 'I ordered it about three weeks ago.（3週間くらい前に注文しました）' },

    // R fix: V2 (blind 70 %): the key was the only specific promise. "He said she could get one too" matches it.
    // why: get one too ← "pick a new chair" and "I really want it" heard as a new chair for her; order it ← the
    //   receptionist's job, a guess the audio never makes
    { id: 'd1', skill: 'detail', level: 'B1', point: 'promise', seg: [15.3, 22.3],
      stem: 'Why does Pam care which chair Michael picks?',
      choices: ['He promised her his old one', 'He said she could get one too', 'She has to order it for him'], a: 0,
      cue: 'normally のあと、but で始まる理由。',
      line: 'normally I *wouldn’t care*, but he *promised me his old one*.',
      said: '「普段なら気にしないけど、古いイスをくれると約束してくれた」と話す。',
      mean: '新しいイスが決まれば、今のマイケルのイスがパムのものになる。',
      trap: '受付の仕事だから注文係だと思いやすい。but のあとに本当の理由が来る。',
      use: 'He promised me his old laptop.（古いパソコンをくれるって約束したの）' },

    // why: in some ways ← "way" heard as 方法, so "better in a way"; the way she works ← "way" taken as how she does
    //   things
    { id: 'p1', skill: 'phrase', level: 'B1', point: 'way', seg: [19.6, 24.5],
      stem: 'What does Pam say about Michael’s old chair?',
      choices: ['It’s a whole lot better', 'It’s better in some ways', 'It’s better for her work'], a: 0,
      cue: 'better の直前の短い一語。',
      line: 'It’s *way better*. It’s one of these.',
      said: '「（自分のより）ずっといいの」と言う。',
      mean: 'way better ＝ ずっといい。way は比較の語の前で「はるかに」の意味になる。',
      trap: 'way を「方法・点」と取ると「ある意味で」に聞こえる。比べる語の前の way は強め。',
      use: 'This one is way cheaper.（こっちの方がずっと安いよ）' },

    // R fix: K1 + V2 (blind 60 %): "Her? The one in the… chair?" really does check which woman he means, so that
    //   distractor was defensible. It's now the literal yes/no answer, which she never gives.
    // why: never seen her ← the yes/no question answered literally (a question gets a yes or a no); asks why ← "Her?"
    //   heard as disbelief, but she goes on about the chair, not the woman or the ad
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'steer', seg: [29.2, 36.0],
      stem: 'When Michael asks if Pam has seen this woman, what does her reply do?',
      choices: ['Brings the chair into it instead of the woman', 'Answers that she has never seen her before',
                'Asks why he likes some woman in an ad'], a: 0,
      cue: '「Her?」のあと、説明しているのは何か。',
      line: 'Have you ever seen this woman? — Her? The one in the… mesh, black, high-back *swivel chair*?',
      said: '「この人見たことある？」に、「あの、メッシュで黒でハイバックの回転イスに座ってる人？」と返す。',
      mean: '女性ではなくイスを細かく言うことで、話をイス選びに戻している。',
      trap: 'Her? は確認や驚きにも聞こえるが、そのあと語られるのはイスの特徴だけ。',
      use: 'You mean the one by the window?（窓のそばのやつのこと？）' },

    // R fix: V2 (blind 70 %) + S1: "two sides" in the stem pointed at a contrast, and "so she must be tired" was a
    //   filler. The stem now names the moment; the choices differ only in the link.
    // why: addition ← "and" caught but "yet" lost; result ← "and" heard as "so", with "professional" pulling toward work
    { id: 'm1', skill: 'marker', level: 'B2', point: 'yet', seg: [41.7, 49.4],
      stem: 'How does Michael tie “dresses like a professional” to what comes next?',
      choices: ['As a contrast: she looks formal, yet could relax', 'As an addition: she looks formal and dresses well',
                'As a result: she looks formal, so must work hard'], a: 0,
      cue: 'professional のあとの二語。',
      line: 'She dresses like a professional, *and yet* you know there is a side of her that could just curl up on a couch.',
      said: '「仕事のできる人の服装なのに、ソファで丸くなるような一面もある」とうっとり話す。',
      mean: 'and yet ＝ それなのに。意外な組み合わせを並べて、魅力を語っている。',
      trap: 'and だけ聞くと「そして・だから」に取りやすい。yet が付くと逆の向きになる。',
      use: 'It’s small, and yet it’s really comfy.（小さいのに、すごく快適）' },

    // R fix: V2: "ready to meet them" was weak. Now swear ＝ 誓う taken literally.
    // why: cursing ← swear ＝ ののしる, the literal sense; treat them better ← swear ＝ 誓う, "swearing… women" heard
    //   as a vow made to women
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'swear', seg: [51.2, 58.5],
      stem: 'What had Michael said about women after his dinner party?',
      choices: ['He was giving them up', 'He was cursing at them', 'He was promising to treat them better'], a: 0,
      cue: 'swearing のすぐあとの短い語。',
      line: 'when I said that I was *swearing off women*?',
      said: '「ディナーパーティーのあと、女性はもうやめると言ったよね？」と言う。',
      mean: 'swear off ＝ きっぱりやめると誓う。お酒やお菓子にも使う。',
      trap: 'swear だけだと「ののしる」に聞こえる。後ろの off で「断つ」の意味になる。',
      use: 'I’m swearing off sugar this month.（今月は甘い物を断つ）' },

    // R fix: V2 (blind 60 %) + S3: "never made such a vow" was easy to rule out, and the cue's "women" was in the key
    //   only. The new distractor reverses the direction.
    // why: widens ← the two scopes heard in the wrong order (Jan said last, taken as the old vow); stricter ←
    //   "completely" heard as making the vow stronger
    { id: 'h1', skill: 'humor', level: 'C1', point: 'onewoman', reveals: ['swear'], seg: [53.8, 66.0],
      stem: 'Why does Michael’s correction of his old vow get a laugh?',
      choices: ['He narrows it from all women down to Jan', 'He widens it from just Jan to all women',
                'He makes it stricter than it was before'], a: 0,
      cue: '前の誓いと言い直しで、相手が何人か。',
      line: 'what I meant was that I am *completely* swearing off *one woman*. … Jan.',
      said: '「ひとりの女性を完全に断つって意味だった。ジャンだ」と言い直す。',
      mean: '「女性全部」を「ジャンひとり」に縮め、誓いを中身のないものにした。',
      trap: 'completely が強いので厳しくしたと思いやすい。women と one woman の差を聞く。',
      use: 'What I meant was just this once.（言いたかったのは、今回だけってこと）' },

    // why: agreement ← "actually" read as 実は, a softer "yes, it was fate"; new topic ← the first word of a reply heard
    //   as a change of subject
    { id: 'm2', skill: 'marker', level: 'B2', point: 'fate', seg: [68.2, 74.6],
      stem: 'When Michael credits fate, what does Pam’s first word signal?',
      choices: ['A correction of what he just said', 'Agreement with a little surprise', 'A change to a new subject'], a: 0,
      cue: '返事の最初の一語と、そのあとの主語。',
      line: 'fate put this catalog in my hands. — *Actually*, *I* put the catalog in your hand…',
      said: '「運命がカタログを手に置いた」に、「いや、置いたのは私。イスを選ぶためにね」と返す。',
      mean: 'actually は相手の言葉を事実で直す合図。運命ではなく自分だと言っている。',
      trap: '「実は」と訳すと打ち明け話に聞こえる。相手の発言の直後なら訂正のことが多い。',
      use: 'Actually, it starts at seven.（いや、7時からだよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'haveto', seg: [71.2, 74.7],
      stem: 'Type what Pam says: “…because you ___ a new chair.” (4 words)', answer: 'have to pick out',
      cue: 'because you のあと、chair の前まで。',
      line: 'because you *have to pick out* a new chair.',
      said: '「新しいイスを選ばなきゃいけないから」と言う。',
      mean: 'have to は「ハフタ」に縮み、pick out は「ピカウ」とつながる。pick out ＝ 選ぶ。',
      trap: 'have to の v が f に変わり、別の語に聞こえやすい。縮んだ形ごと覚える。',
      use: 'I have to pick out a gift.（プレゼントを選ばなきゃ）' },

    // R fix: V2 (blind 65 %): the key was the only hedged, two-part choice. All three now share "Cheerful words…".
    // why: enjoys being free ← "I like it… possibility" taken at face value; stay single ← "I like it" as content,
    //   missing the hunt in "desperate" and the next line
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'single', reveals: ['littlemore'], seg: [76.5, 88.6],
      stem: 'How does the answer to “What is it like being single?” present single life?',
      choices: ['Cheerful words, but the reason shows he’s anxious', 'Cheerful words, and he truly enjoys being free',
                'Cheerful words, though he means to stay single'], a: 0,
      cue: '「好き」「楽観的」と、その理由の語の差。',
      line: 'I *like it*… And I’m *optimistic* because every day I get a little more *desperate*.',
      said: '「気に入ってる。楽観的だよ、日に日に必死になっていくから」と答える。',
      mean: '明るい言葉で語るが、楽観の理由が「必死さ」。焦りが見えてしまう。',
      trap: 'I like it と optimistic だけだと満足に聞こえる。because 以下の理由まで聞く。',
      use: 'Honestly? I’m a little desperate.（正直、ちょっと焦ってる）' },

    // R fix: V2 (blind 60 %): "my best work under pressure" left the dating topic, so it was easy to rule out. Now the
    //   "rock bottom" reading of the same optimism.
    // why: only get better ← optimism from the bottom, but he says the desperation itself brings results; get through
    //   it ← the line taken as sincere comfort (the 前向き frame)
    // anchor: 83.8–91.4 s "optimistic because every day I get a little more desperate. And desperate situations yield the
    //   quickest results": desperation is the engine of the optimism, so the "results" come from lowering the bar
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'single', reveals: ['littlemore'], seg: [83.3, 92.0],
      stem: 'Which plain-English version keeps what the answer means about dating?',
      choices: ['“The less picky I get, the sooner I’ll find someone.”', '“Being alone is hard, but I’ll get through it soon.”',
                '“Things are so bad now, they can only get better.”'], a: 0,
      cue: '「必死」が二度目に出てくる文の主語と結果。',
      line: 'every day I get a little more *desperate*. And *desperate situations yield the quickest results*.',
      said: '「日に日に必死になる。必死な状況ほど結果は早く出る」と、楽観の理由を説明する。',
      mean: '必死さを楽観の根拠にする逆転。結果が早いのは、選り好みしなくなるから。前向きな顔で焦りを語る。',
      trap: '「底まで落ちればあとは上がる」と取りやすいが、ここでは必死さそのものが早い結果の原因。何が何を生むかを聞く。',
      use: 'At this point, I’m not picky.（もうこの際、選り好みしない）' },

    // R fix: V2 (blind 50 %): "a little less" clashed with "desperate" for a blind reader. Now "a bit more".
    // why: a lot more ← little/lot: the flapped t of "little" (リル) against "lot"; a bit more ← same sense, and the
    //   weak "a" plus a short syllable heard as "bit"
    { id: 's1', skill: 'sound', level: 'B2', point: 'littlemore', seg: [85.2, 88.6],
      stem: 'Fill the gap: “every day I get ___ desperate.”',
      choices: ['a little more', 'a lot more', 'a bit more'], a: 0,
      cue: 'get のあと、弱くつながる三語。',
      line: 'every day I get *a little more* desperate.',
      said: '「毎日少しずつ必死になっていく」と言う。',
      mean: 'a little more は「アリルモア」と一続き。little の t は弾んで「ル」に近い。',
      trap: 'little の t が弱いと lot に聞こえやすい。母音の長さで聞き分ける。',
      use: 'Could you make it a little more?（もう少し多めにできますか）' },

    // why: 18 ← eighty/eighteen (-ty/-teen); 80 ← the final "five" lost; 95 ← eighty/ninety blur at speed
    { id: 'n2', skill: 'number', level: 'B1', point: 'page', seg: [91.7, 96.8],
      stem: 'In the announcement, which page is everyone asked to turn to?',
      choices: ['18', '80', '85', '95'], a: 2, keep: true,
      cue: 'page のあとの数字、最後の音まで。',
      line: 'kindly turn to *page 85*.',
      said: '全員に「カタログの85ページを開いて」と呼びかける。',
      mean: 'eighty-five。最後の five まで言っている。あのモデルが載っているページ。',
      trap: 'eighty と eighteen は強勢の位置で分かれる。eighty のあとに続く数まで聞く。',
      use: 'Please turn to page 85.（85ページを開いてください）' },

    // R fix: V2 (blind 55 %): "Pam picks" was weak. Now a second "hasn't… yet".
    // why: has picked ← hasn't heard as has (final -n't lost); hasn't come in ← "hasn't… yet" caught but the verb lost,
    //   heard as an order not yet delivered
    { id: 'd2', skill: 'detail', level: 'B1', point: 'notyet', seg: [100.5, 104.6],
      stem: 'When a coworker asks about Michael’s new chair, what is the answer?',
      choices: ['He hasn’t picked one yet', 'He has picked one at last', 'It hasn’t come in yet'], a: 0,
      cue: 'No のあと、he の次の短い語。',
      line: 'Is this his new chair? — No, he *hasn’t picked one yet*.',
      said: '「これ新しいイス？」に「いや、まだ選んでない」と答える。',
      mean: 'hasn’t … yet ＝ まだ〜していない。3週間たっても決まっていない。',
      trap: 'hasn’t の t は消えやすく has に聞こえる。文末の yet が否定の手がかり。',
      use: 'Sorry, I haven’t decided yet.（すみません、まだ決めてません）' },

    // R fix: V2 (blind 50 %) + B1: "orders a new one" was weak, and the key says Pam gets Michael's chair, which is
    //   d1's answer: reveals `promise`.
    // why: Michael's after Pam ← "Michael's" is the first chair named; Michael's new one ← "new chair" is the scene's
    //   topic, and the chain heard backwards
    { id: 'd3', skill: 'detail', level: 'B2', point: 'chain', reveals: ['promise'], seg: [105.3, 111.4],
      stem: 'How will the coworker get another chair?',
      choices: ['He gets Pam’s when she gets Michael’s', 'He gets Michael’s when Pam is done with it',
                'He gets Michael’s new one once it arrives'], a: 0,
      cue: 'When の文の、二つ目の I get のあと。',
      line: 'When Pam gets Michael’s… chair, *I get Pam’s old chair*.',
      said: '「パムがマイケルのイスをもらったら、僕がパムの古いイスをもらう」と話す。',
      mean: '新しいイスが決まると、古いイスが順に回ってくる。彼はその列の最後。',
      trap: '先に出る Michael’s に引っぱられやすい。I get のあとの名前が自分の分。',
      use: 'Got a new phone? Can I have yours?（新しいの買った？古いのちょうだい）' },

    // why: one more day ← "to go" heard as time left; Michael's chair ← the first name in the chain, heard as his real aim
    { id: 'i1', skill: 'infer', level: 'C1', point: 'onetogo', reveals: ['chain'], seg: [105.3, 113.6],
      stem: 'What does the coworker’s last remark show about his goal?',
      choices: ['He is aiming to own three chairs', 'He is waiting just one more day', 'He wants Michael’s chair for himself'], a: 0,
      cue: '「2つ」と言ったあとの短い一言。',
      line: 'Then I’ll have *two chairs*. *Only one to go.*',
      said: '「そしたらイスが2つ。あと1つだ」と言う。',
      mean: 'one to go ＝ あと1つで目標達成。2つで終わりではなく、3つ集めるつもり。',
      trap: 'to go を「行く」や残り時間と取りやすい。数のあとの to go は「残り」。',
      use: 'Two done, one to go.（2つ終わり、あと1つ）' },

    // R fix: V2 (blind 55 %): "repair his old chair" was a filler. Now "with any of your friends" heard on its own.
    // why: cheer him up ← fix ＝ 直す, "fixing me" heard as making him feel better; out with friends ← "with any of your
    //   friends" heard without "fixing me up"
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'fixup', reveals: ['template'], seg: [113.6, 124.7],
      stem: 'In the closing announcement, what might some coworkers be planning?',
      choices: ['To set him up on a date', 'To cheer him up after Jan', 'To bring him out with their friends'], a: 0,
      cue: 'fixing me のあとの短い語と、with の先。',
      line: 'for those of you who are thinking about *fixing me up* with any of your friends',
      said: '「友だちを紹介しようと思ってる人へ」と前置きする。',
      mean: 'fix A up with B ＝ A に B を紹介してデートさせる。up と with が目印。',
      trap: 'fix を「直す」と取ると励ましに聞こえる。fix 人 up with 人、なら紹介の話。',
      use: 'Can you fix me up with someone?（誰か紹介してくれない？）' },

    // R fix: V2 (blind 65 %) + B1: "works for the catalog firm" was weak, and the line shows "page 85" (n2): reveals
    //   `page`. All three choices are now "Someone just like…".
    // why: like him ← "ready to start dating again" heard as wanting someone in the same spot; like their friends ←
    //   "any of your friends" heard as the model to follow
    { id: 'i2', skill: 'infer', level: 'B2', point: 'template', reveals: ['page'], seg: [118.0, 131.4],
      stem: 'What kind of woman should the coworkers look for, by the end?',
      choices: ['Someone just like the model on that page', 'Someone just like him: single and ready',
                'Someone just like their own good friends'], a: 0,
      cue: '最後の文、use のあとに出てくる場所。',
      line: 'use *the woman on page 85* as a *template*.',
      said: '「紹介するなら、85ページの女性をお手本にして」と言って締める。',
      mean: 'template ＝ ひな型。カタログのモデルが理想の基準になっている。',
      trap: 'friends が聞こえ、友だちに似た人と取りやすい。as a template は「〜を見本に」。',

      use: 'Use this one as a template.（これをひな型にして）' },
  ]
};
