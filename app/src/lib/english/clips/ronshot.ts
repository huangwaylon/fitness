// “Leslie Knope Shoots Ron Swanson | Parks and Recreation” (the official Parks and Recreation channel, Season 2): on
// the parks department's hunting trip Ron is shot in the back of the head; he suspects Leslie, Ann patches him up,
// nobody owns up, the group talks itself into a hunter in the woods, and when the ranger asks, Leslie says she did it.
// Segments from the captions, words from whisper (2026-11-16). Untested: 13–45 s (the shot and the shouting), 72–90 s
// (Donna's turn; both sources garbled), 130–142 s (the palm line and the cramps line), 152–176 s (the purge, voices
// overlap; "20 years of scotch" is whisper's only), 246–258 s (captions empty; whisper's "Craig from Reinhold
// Mercedes" unconfirmed), 270–274 s (who says "I know what happened"), and 279–285 s (whisper's "I don't know. That's
// the problem. I am." isn't in the captions; both have "I… shot Ron Swanson").
// REVIEW 2026-11-16: pass 8, fix 16, drop 0, new 0; ear checks 4 (on 2 lines, unchanged)
//   Open: who is the visitor at 274.9 s (the ranger?), and is whisper's "You shot my Mercedes?!" (285 s, not in the
//   captions) real? d4's key now reads "what happened", so it holds either way.
// EAR CHECK: 108.8–122.7 s s1 nt3 x1 — whisper "Did you, did you shoot me?", captions one "did you"; whisper "a bird
//   kinda near me", captions "kind of near me" (nt3 keys on "kind of"); both "you better find out" with no "'d" (x1)
// EAR CHECK: 61.6 s s3 — both sources have "won't": confirm the vowel is "woe-" (not "want") and the t is unreleased
import type { Clip } from '../types.ts';

export const ronShot: Clip = {
  id: 'ronshot', video: 'R99bq9xbLLE', title: 'Leslie Knope Shoots Ron Swanson', dur: 302, wpm: 157,
  band: 'mid', tags: ['職場', '旅行'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: Three ← "three" is the only number said; Five ← counting himself in
    { id: 'n1', skill: 'number', level: 'B1', point: 'home', seg: [0, 7.53],
      stem: 'How many people does the man at the start live with?',
      choices: ['Three', 'Four', 'Five'], a: 1, keep: true,
      cue: 'at my house のあと、家族の数。',
      line: 'at my house, I got *a wife and three beautiful daughters*.',
      said: '家には妻と娘3人がいると話し、この旅行は年に一度の楽しみだと言う。',
      mean: '妻1人と娘3人で、家では女性4人と暮らしている。だからこの旅行が特別。',
      trap: 'three が一番強く聞こえるので、そのまま選びやすい。a wife の a も1人と数える。',
      use: 'I live with my wife and two kids.（妻と子ども2人と暮らしてる）' },

    // R fix: V2 (blind 50 %): "steers the talk away" was a filler. The new third option is the Japanese 実は frame
    //   (a lead-in to bad news).
    // why: admits it's serious ← "not" is weak and easy to lose, leaving "actually… serious"; softens bad news ←
    //   「実は」 opens a confession of bad news in Japanese
    { id: 'm1', skill: 'marker', level: 'B2', point: 'serious', seg: [45.3, 52.38],
      stem: 'Right after “shot in the head with a shotgun!”, what does the reply’s opening do?',
      choices: ['It corrects how bad he thinks the wound is', 'It admits the wound is serious, after all',
                'It softens bad news she’s about to give'], a: 0,
      cue: 'shotgun のすぐあと、返事の最初の部分。',
      line: 'it’s *actually not that serious*. I just need you to stay calm',
      said: '撃たれたと叫ぶロンに「実はそんなに深刻じゃない。落ち着いて」と返す。',
      mean: 'actually は相手の思い込みを正す合図。',
      trap: 'not を聞き落とすと「深刻だ」と逆になる。日本語の「実は」と違い、actually は思い込みの訂正。',
      use: 'Actually, it’s not that bad.（実はそんなに悪くないよ）' },

    // R fix: V2 (blind 50 %): the key echoed the line ("relaxes"), and the others were remote. Now three ways he
    //   could answer, and the key has no clip word.
    // why: nothing much ← "Yeah" heard as going along with "not that serious", Ron-style bravado; blames her ←
    //   "stay angry" heard as a reaction to her words
    { id: 'h1', skill: 'humor', level: 'C1', point: 'angry', seg: [50.31, 56.07],
      stem: 'Why is Ron’s answer to “stay calm” funny?',
      choices: ['He says anger is what calms him down', 'He shrugs off being shot as nothing much',
                'He blames her calm words for his anger'], a: 0,
      cue: 'Yeah のあと、2つの短い文。',
      line: 'Yeah, I’m just gonna *stay angry*. I find that *relaxes me*.',
      said: '「落ち着いて」と言われ、「怒ったままでいる。その方が落ち着くんだ」と返す。',
      mean: '普通は怒りを静めて落ち着くのに、ロンは逆。怒るとくつろげるという言い方が笑い。',
      trap: '最初の Yeah で同意に聞こえる。Yeah のあとの中身で、返事の向きを決める。',
      use: 'Oddly, coffee relaxes me.（不思議とコーヒーで落ち着く）' },

    // R fix: V2 (blind 55 %): the guns choice was weak. The new near miss is "home today" against "next year".
    // why: home today ← "this is a mess" + a ranger on the way, and "come back" heard without "next year"; fine ← the
    //   rangers are coming, so money sounds likely
    { id: 'd1', skill: 'detail', level: 'B1', point: 'rangers', seg: [55.38, 63.54],
      stem: 'Why is Ron upset to hear a ranger is coming?',
      choices: ['They won’t let the group come back next year', 'They will send the whole group home today',
                'They will make the group pay a big fine'], a: 0,
      cue: 'this is a mess のあと、レンジャーが何をするか。',
      line: 'This is a mess. The rangers *won’t let us come back next year*.',
      said: '「まずい。来年もう来させてもらえない」と、自分の傷より旅行の心配をする。',
      mean: 'レンジャーに知られると、来年からこの狩りに来られなくなるという心配。',
      trap: '銃の事故なので罰金や帰される話を思い浮かべやすい。let us のあとと、文末の時を聞く。',
      use: 'They won’t let us back in.（もう中に入れてもらえない）' },

    // why: will ← "won't" loses its t and sounds like a short "woe"; want to ← /oʊ/ vs /ɑ/ (won't/want); don't ←
    //   another n't word with the same ending
    // R fix: V2 (blind 70 %): "come back next year" in the stem made "won't" the only natural complaint. The stem
    //   now stops at "let us…".
    { id: 's3', skill: 'sound', level: 'B2', point: 'rangers', seg: [59.07, 63.54],
      stem: 'Fill the gap: “The rangers ___ let us…”',
      choices: ['won’t', 'want to', 'don’t', 'will'], a: 0,
      cue: 'rangers のすぐあと、短い1語。',
      line: 'The rangers *won’t* let us come back next year.',
      said: '「レンジャーは来年、来させてくれない」と嘆く。',
      mean: 'won’t は「ウォウン(ト)」。want の「ワ」より口が丸く、最後の t はほぼ聞こえない。',
      trap: 't が消えると will や want に聞こえやすい。直前の「まずい」と合う方を選ぶ。',
      use: 'The hotel won’t let us check in early.（ホテルが早めに入れてくれない）' },

    // R fix: V2 (blind 55 %): two absolute distractors ("promises", "for good"). Now an over-reassurance and an
    //   agree-then-move-on reading.
    // why: it will be fine ← "You know what?" often comes before good news, a reassurance script; agrees it's a mess
    //   ← Ron's "This is a mess" heard as hers, then "right now" as moving on
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'notnow', reveals: ['rangers'], seg: [59.07, 65.4],
      stem: 'When Ron worries about next year, what does the reply do?',
      choices: ['Sets that worry aside for the moment', 'Tells him not to worry, it will be fine',
                'Agrees it’s a mess, then moves on'], a: 0,
      cue: 'You know what? のあと、right now まで。',
      line: 'You know what? *We’re not gonna think about that right now*.',
      said: '来年の心配をするロンに「ねえ、今はそれは考えないでおこう」。',
      mean: 'けが人を落ち着かせるため、心配を否定も肯定もせず横に置く言い方。',
      trap: 'You know what? は良い知らせの前にも来るので「大丈夫」に聞こえやすい。right now は「今は」。',
      use: 'Let’s not worry about that right now.（今はそれは考えないでおこう）' },

    // R fix: V2 (blind 60 %): only the key was hedged ("a bit"). Each choice is now a feeling plus a reason.
    // why: cheerful ← "you know what is great?" sounds upbeat; joking about Ann ← "best nurse in North America" is so
    //   big it sounds sarcastic
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'fuss', seg: [93.5, 106.6],
      stem: 'As Leslie fusses over Ron, how does she seem?',
      choices: ['Nervous, and trying too hard to help', 'Cheerful, since she is sure he will be fine',
                'Joking, poking a little fun at Ann'], a: 0,
      cue: '「okay」の多さと、ほめ言葉の大きさ。',
      line: 'Hey, you know what is great? … Ann is *the best nurse in North America*.',
      said: '飲み物を渡し、何度も okay と言い、「アンは北米一の看護師よ」と励ます。',
      mean: '大げさなほめ言葉と落ち着かない言い方で、なんとか役に立とうと必死な様子。',
      trap: '北米一は大きすぎて皮肉に聞こえやすいが、相手はロン。けが人を安心させたい一心の言葉。',
      use: 'Don’t worry, you’re in good hands.（大丈夫、安心して任せて）' },

    // R fix: V2 (blind 60 %, §9.4): the title trap was too obvious, and "can't remember" was weak. Both distractors
    //   now come from lines in the clip.
    // why: blaming Leslie ← the title, and Ron's "Did you shoot me?" (he moves on to "find out who it was"); hide it ←
    //   "The rangers won't let us come back" (they called 911 themselves)
    { id: 'g1', skill: 'gist', level: 'B1', point: 'admit', reveals: ['blame'], seg: [107.0, 286.2],
      stem: 'After Ron is hit, what problem drives the rest of the clip?',
      choices: ['Nobody will own up to firing the shot', 'Ron won’t stop blaming Leslie for it',
                'They must hide it from the rangers'], a: 0,
      cue: '途中で何度もくり返される問いに注目。',
      line: '*No one will admit* they shot Ron, and no one saw it happen.',
      said: '撃った人を皆に聞いても、名乗る人がいない。最後に、ある人が自分だと言う。',
      mean: '「誰が撃ったか」が分からないまま話が進む。けがよりも犯人探しが中心の場面。',
      trap: '題名につられてレスリーを責める話と思いやすいが、ロンもすぐ「誰か突き止めろ」に変わる。',
      use: 'Nobody will own up to it.（誰も名乗り出ない）' },

    // R fix: V2 (blind 60 %): "Would you" was the only other option, and a weak one. A fourth strong option is in:
    //   "Why'd you", an accusation that ends in the same "-dja".
    // why: Would ← "did you" runs into "didja" and the d is heard as "wou-"; Didn't ← an accusation often comes as
    //   "didn't you", and the t would drop; Why'd ← the same "-dja" ending, and an accusing question fits the moment
    { id: 's1', skill: 'sound', level: 'B2', point: 'didyou', seg: [108.82, 112.33],
      stem: 'Fill the gap: “___ shoot me?”',
      choices: ['Did you', 'Didn’t you', 'Would you', 'Why’d you'], a: 0,
      cue: '文の最初、つながった2語。くり返しに注目。',
      line: '*Did you*, did you shoot me?',
      said: 'ロンが「お前、撃ったのか？」と聞く。同じ2語をくり返す。',
      mean: 'did you は d と y がつながり「ディジュ」に近い。過去を確かめる質問。',
      trap: 'n’t の「ン」は弱くても残る。聞こえないなら Didn’t ではない。Would は「ウ」で始まる。',
      use: 'Did you take my umbrella?（私の傘、持っていった？）' },

    // why: behind him ← the wound is in the back of the head (later), so where she stood sounds likely; bragged ←
    //   "bird" + "prove yourself" heard as a boast about her aim (both two-part, like the key)
    { id: 'd2', skill: 'detail', level: 'B2', point: 'bird', seg: [108.82, 116.8],
      stem: 'What reasons does Ron give for thinking it was Leslie?',
      choices: ['A bird was near him, and she wanted to prove herself',
                'She was right behind him, and her gun was loaded', 'She bragged she could hit any bird, and missed'],
      a: 0,
      cue: 'There was のあと、and のあとまで2つ。',
      line: 'There was *a bird* kind of *near me*, and I know how *desperate you were to prove yourself*.',
      said: '「近くに鳥がいたし、お前は腕を見せたくて必死だった」と言う。',
      mean: '鳥を狙って外したのでは、という疑い。prove yourself ＝ 力を見せる。',
      trap: 'bird と prove が並ぶと腕自慢の話に聞こえる。desperate は自慢でなく必死さ。',
      use: 'I know how badly you wanted this.（どれだけ欲しかったか知ってるよ）' },

    // anchor: 113.17–114.07 s six words in about a second, "kind of" inside a plain statement of where the bird was;
    //   grammar doesn't need it, so the ear has to catch it (captions "kind of", whisper "kinda": EAR CHECK)
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'bird', seg: [111.33, 115.12],
      stem: 'Type Ron’s words: “There was ___, and I know…” (5 words)', answer: 'a bird kind of near me',
      cue: 'There was のあと、and の前の5語。',
      line: 'There was *a bird kind of near me*, and I know…',
      said: '「近くに、まあ鳥がいた」と言う。kind of は弱く短く、「カインダ」とひと続き。',
      mean: 'kind of は「だいたい」とぼかす語。鳥の位置を少しぼかすだけで、なくても文は通る。',
      trap: '意味に要らない語は耳が落としやすく、a bird near me と書きがち。語の数を手がかりに。',
      use: 'It was kind of near the station.（駅のわりと近くだった）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'findout', seg: [119.89, 122.65],
      stem: 'Type what Ron says: “___ who it was.” (4 words)', answer: 'you better find out',
      cue: 'Well のあと、who の前の4語。',
      line: 'Well, *you better find out* who it was',
      said: '「じゃあ、誰がやったか突き止めた方がいい」と言う。',
      mean: 'you better は you’d better の d が落ちた形。ここでは命令に近い。',
      trap: 'better の t は弾んで「ベラー」に近く、find とつながる。音より語の数で区切る。',
      use: 'You better find out soon.（早く確かめた方がいいよ）' },

    // R fix: V2 (blind 50 %): "forgive" was a filler. Now the third option reads "find out who it was" as wanting a
    //   confession.
    // why: his own death ← "coffin" taken literally, a shot to the head; own up first ← "find out who it was" heard as
    //   wanting a confession only
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'coffin', seg: [119.89, 126.2],
      stem: 'When Ron brings up a coffin, what does he mean?',
      choices: ['He’ll make the shooter pay for it', 'He’s afraid the wound could kill him',
                'He wants the shooter to own up first'], a: 0,
      cue: 'coffin のあと、because の理由。',
      line: '…and then *purchase them a coffin*, because I’m gonna *rip them apart*!',
      said: '「撃った奴にひつぎを買ってやれ。八つ裂きにしてやる」と言う。',
      mean: 'ひつぎは相手のためのもの。見つけたら仕返しするという強い怒りの言い方。',
      trap: '頭を撃たれた後なので、自分の死の話に聞こえやすい。them が誰を指すかを聞く。',
      use: 'Whoever did this is in big trouble.（やった人はただじゃすまない）' },

    // R fix: V2 (blind 55 %): "one at a time" had no basis in the line. Now the literal "wash" (rinse) is the trap.
    // why: rinsed ← "wash" taken as 洗う; a big meal ← "wash down" also goes with food
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'fluids', seg: [142.09, 148.6],
      stem: 'When asked about the pills, what does Ron say he did with them?',
      choices: ['Swallowed them with lots to drink', 'Took them, then rinsed his mouth out',
                'Took them along with a big meal'], a: 0,
      cue: 'How many のあと、with の前の動詞。',
      line: 'I *washed them down* with plenty of fluids.',
      said: '何錠飲んだか聞かれ、「たっぷりの飲み物で流し込んだ」と答える。',
      mean: 'wash down ＝ 飲み物で薬や食べ物を流し込む。洗う意味ではない。',
      trap: 'wash を「洗う」と取ると意味が通らない。薬のあとの down は「飲み込む」。with のあとも聞く。',
      use: 'I washed it down with tea.（お茶で流し込んだ）' },

    // R fix: V2 (blind 65 %): the only alcohol among soft drinks. Now "Beer" makes two.
    // why: water ← "fluids" is the word a doctor uses for "drink water"; beer ← the usual drink on a men's trip, and
    //   "drink… with this" fits any alcohol
    { id: 'i2', skill: 'detail', level: 'B1', point: 'fluids', seg: [145.08, 150.82],
      stem: 'By Ann’s reply, what were Ron’s “fluids”?',
      choices: ['Scotch', 'Water', 'Beer'], a: 0,
      cue: 'No, Ron のあと、飲んではいけない物。',
      line: 'plenty of fluids. — No, Ron, *you cannot drink scotch* with this.',
      said: 'ロンが飲み物で流し込んだと言うと、アンが「スコッチと一緒はだめ」と止める。',
      mean: 'fluids ＝ 水分。普通は水の意味だが、ロンの「水分」はウイスキーだった。',
      trap: 'fluids は医者が言う「水分をとって」の語なので水と思いやすい。返事の名詞で決める。',
      use: 'You can’t drink with this medicine.（この薬とお酒は一緒にだめ）' },

    // R fix: V2 (blind 50 %): the rangers choice came from outside this stretch and was longer than the rest. The
    //   new one is built on "just say I did it".
    // why: shot himself ← the idea is raised and discussed; confess ← "if you did it, just say I did it" opens the
    //   stretch
    { id: 'g2', skill: 'gist', level: 'B2', point: 'hunted', reveals: ['admit'], seg: [176.0, 247.0],
      stem: 'While Ron rests, where does the group’s talk end up?',
      choices: ['Fearing someone outside is hunting them', 'Agreeing Ron most likely shot himself',
                'Pressing the shooter among them to confess'], a: 0,
      cue: '最後の方、out there が何度も出る所。',
      line: 'You think *someone is hunting us*? … It could still be out there.',
      said: '誰も名乗り出ないので、自分で撃った説を経て、外に誰かがいて自分たちを狙っていると騒ぎ出す。',
      mean: '犯人探しが、森に狩人がいるという大げさな話にふくらんでいく流れ。',
      trap: '自分で撃った説は途中で消える。話がどこで終わるかは、最後の数行で決める。',
      use: 'Let’s not get carried away.（話を大きくしすぎないで）' },

    // anchor: 188.54–191.81 s "how pissed is he?" is answered "he's very curious about who shot him": a question
    //   about anger gets a word about interest; 120–125.6 s (a3) "purchase them a coffin… rip them apart"
    // why: mildly interested ← "curious" taken at face value (the literal hedge); already knows ← "who shot him" heard
    //   as a name he has, but "curious about who" means he doesn't know
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'coffin', seg: [186.56, 193.07],
      stem: 'Asked how angry Ron is, what does the answer avoid saying?',
      choices: ['That he is furious and out for revenge', 'That he is only a little interested by now',
                'That he already knows who shot him'], a: 0,
      cue: '怒りを聞かれて、どんな語で答えたか。',
      line: 'how pissed is he? — Well, he’s *very curious* about who shot him.',
      said: '「どれくらい怒ってる？」に「誰が撃ったのか、とても気にしてる」と答える。',
      mean: '怒りの度合いを聞かれて「気にしてる」は、わざと控えめな言い方。ひつぎの話のとおり、本当は仕返しする気。',
      trap: 'curious を文字通り取ると軽い興味になる。怒りの質問に穏やかな語が返ったら、強い怒りを疑う。',
      use: 'Let’s just say he’s not thrilled.（喜んではいない、とだけ言っておく）' },

    // R fix: V2 (blind 50 %): the key was the only abstract, hedged choice ("quite the wrong reason"). All three now
    //   name what the reply does.
    // why: hints he did ← "Maybe Ron shot himself… depressed" opens the stretch; mocking ← "loves the back of his head"
    //   heard as a dig at his looks
    { id: 'h2', skill: 'humor', level: 'C1', point: 'backhead', seg: [206.93, 217.34],
      stem: 'Why does the reply “You’re right…” get a laugh?',
      choices: ['It agrees, but misses why the spot matters', 'It hints that Ron shot himself after all',
                'It mocks Ron for being vain about his looks'], a: 0,
      cue: 'You’re right のあと、理由の中身。',
      line: 'He was shot in the *back of the head*. — You’re right. *He loves the back of his head.*',
      said: '後頭部を撃たれたと聞き、「その通り。彼は後頭部が大好きだから」と返す。',
      mean: '後頭部は自分では撃ちにくい、という指摘を、好きな場所だからと取り違えて納得している。',
      trap: 'からかいに聞こえるが、本人は本気。同意の理由がずれているのが笑い。',
      use: 'That’s not quite what I meant.（そういう意味じゃないんだけど）' },

    // anchor: 207.58–213.32 s "Maybe Ron shot himself" is answered "He was shot in the back of the head": a reply to
    //   the self-shot idea, so its point is where a person can aim; 213.5 s "You're right. He loves…" is the misreading
    // why: favorite part ← the in-clip reply (right mechanism, wrong reason); not serious ← Ann's "not that serious"
    //   (50 s) heard as the point of where he was hit
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'backhead', reveals: ['serious'], seg: [206.93, 217.34],
      stem: 'Which reply would match the point of “the back of the head”?',
      choices: ['Right, he couldn’t have done that himself.', 'Right, he’d never hurt his very favorite part.',
                'Right, so it can’t be all that serious.'], a: 0,
      cue: '直前の「自分で撃った」説への返事として聞く。',
      line: 'Maybe Ron shot himself. … He was shot in the *back of the head*.',
      said: '「ロンが自分で撃ったのかも」に、別の人が「後頭部を撃たれたんだよ」と返す。',
      mean: '自分で後頭部は狙いにくい、だから自分ではない、という反論。次の人はそれを「好きな場所だから」と受け取った。',
      trap: '画面の返事につられやすい。事実だけ言う返事は、直前の説への反論として聞くと狙いが分かる。',
      use: 'Right, so it couldn’t be him.（なるほど、じゃあ彼じゃありえない）' },

    // why: an animal ← "it wasn't human" heard as the start of a clue; hiding in the trees ← "pine trees" + "out there"
    { id: 'i3', skill: 'infer', level: 'B2', point: 'smell', seg: [224.51, 230.06],
      stem: 'What does the reply about the smell do?',
      choices: ['Shows the smell was nothing to fear', 'Says the smell came from a wild animal',
                'Warns that someone is hiding in the trees'], a: 0,
      cue: 'wasn’t human のあと、別の人の短い返事。',
      line: 'I did smell something out there, and it wasn’t human. — *That was pine trees.*',
      said: '「外で何かのにおいがした。人間じゃない」に、別の人が「それは松の木だ」と返す。',
      mean: '怖い話をふくらませる人に、ただの木のにおいだと水を差す返事。',
      trap: 'wasn’t human の続きに聞こえると動物の話になる。返事の that は、においを指す。',
      use: 'Relax, that was just the wind.（大丈夫、ただの風だよ）' },

    // R fix: V2 (blind 50 %): "too scared to fire" went against "I'm gonna get my gun". Now it's "What's that gonna
    //   do?" heard as worry about risk.
    // why: "too hard to grasp" ← the idiom "over my head" taken here; too risky ← "What's that gonna do?" heard as an
    //   objection to danger, not to uselessness
    { id: 'h3', skill: 'humor', level: 'C1', point: 'under', seg: [239.57, 247.0],
      stem: 'Why is the reply to “shoot over his head” funny?',
      choices: ['He turns a warning shot into a shot to hit', 'He hears “over his head” as “too hard to grasp”',
                'He thinks a shot over its head is too risky'], a: 0,
      cue: 'What’s that gonna do? のあと、over の反対。',
      line: 'scare him off and shoot over his head. — What’s that gonna do? I’m gonna *shoot under its head*.',
      said: '「頭の上を撃って追い払え」と言われ、「それが何になる。頭の下を撃つ」と返す。',
      mean: '頭の下＝体。おどしの射撃を、当てる射撃に変えている。its で人扱いもしない。',
      trap: 'over one’s head（難しすぎる）を知っていると迷う。ここは文字通りの位置。',
      use: 'That went right over my head.（それ、全然わからなかった）' },

    // why: out of danger ← "out of" heard as "out of trouble"; out of bed ← the literal "out"
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'outofit', seg: [257.75, 264.47],
      stem: 'What does Ann mean about how Ron is doing?',
      choices: ['He’s dazed and not quite aware', 'He’s out of danger and safe now', 'He’s out of bed and on his feet'],
      a: 0,
      cue: 'how is he? への答えの最初。',
      line: 'He’s, uh, *pretty out of it*.',
      said: 'ロンの様子を聞かれ、「かなりぼーっとしてる。寝言であなたの話を」と答える。',
      mean: 'out of it ＝ 頭がはっきりしない、上の空。薬や疲れのあとによく使う。',
      trap: 'out of を「〜から出た」と取ると、危険を脱した話に聞こえる。it は何も指さない。',
      use: 'Sorry, I’m a bit out of it today.（ごめん、今日はちょっとぼーっとしてて）' },

    // R fix: V2 (blind 50 %): "misses having her near" was a filler and the longest choice. Now three short readings
    //   of a sleep-talker.
    // why: fond ← "talking about you" heard as warm; no sense ← "pretty out of it" just before
    { id: 'i4', skill: 'infer', level: 'C1', point: 'sleep', seg: [260.0, 265.18],
      stem: 'After Leslie asks “Good stuff?”, what does the answer suggest?',
      choices: ['Ron still holds a grudge against her', 'Ron is fond of her, even in his sleep',
                'Ron says nothing that makes any sense'], a: 0,
      cue: 'Good stuff? への返事の数と向き。',
      line: 'He’s talking about you in his sleep. — Good stuff? — *No.*',
      said: '「寝言であなたの話をしてる」「いい話？」「いいえ」と短く返される。',
      mean: '寝言でもレスリーを悪く言っている。ロンはまだ彼女に腹を立てているらしい。',
      trap: 'out of it の直後なので、意味のない寝言と思いやすい。No は中身が悪いという答え。',
      use: 'Was it good news or bad?（いい知らせ？悪い知らせ？）' },

    // R fix: V2 + K1 (blind 60 %): the key said "the shooting", but the visitor only says "the accident", and
    //   whisper's "You shot my Mercedes?!" (not in the captions) may mean another accident. The key now says "what
    //   happened", and the distractors stay on the visitor's own words.
    // why: how ← "the accident" heard first, as the topic; anyone saw ← "no one saw it happen" just before
    { id: 'd4', skill: 'detail', level: 'B1', point: 'blame', seg: [274.9, 279.8],
      stem: 'What does the visitor near the end want to find out?',
      choices: ['Who is to blame for what happened', 'How the accident came to happen', 'Whether anyone saw it happen'],
      a: 0,
      cue: 'need のあと、文の最後の語。',
      line: 'I heard about the accident, and I need to know *who is responsible*.',
      said: '「事故のことは聞いた。誰の責任か知る必要がある」と言う。',
      mean: 'responsible ＝ 責任がある。誰のせいかをはっきりさせたい。',
      trap: 'accident が先に聞こえるので、事故の様子の話に思いやすい。need to know のあとが本題。',
      use: 'I need to know who’s in charge here.（ここの責任者が誰か知りたいんです）' },
  ]
};
