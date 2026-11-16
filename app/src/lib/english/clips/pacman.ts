// “Phoebe Is Hogging Ms. Pac-Man | Friends” (the official Friends channel, Best of Season 8): Phoebe won't give up
// the arcade game, Monica wants her turn, Chandler calls it stupid, and when the friend who gave it offers to take it
// back, the answer is a firm no and a hint to go home.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 53 s. Monica is placed by Phoebe's
// “Monica… all your top scores” (4.7 s) and Chandler by Monica's “Chandler, Phoebe's hogging the game” (18.2 s).
// Untested on purpose: who says “You suck” (28.5 s), who answers the offer (37 s: Monica or Chandler, so items say “the
// answer”), who says “Okay, maybe that's it” (49.9 s), and the marker after “But” (whisper “But, you know, in fact”,
// captions “but in fact”).
// EAR CHECK: 25.7 s w1 h2 nt2 — “I don't suck. It sucks.” taken as Chandler's (he was named just before and called
//   it “a stupid game”; nobody says his name on this line)
// EAR CHECK: 25.7 s nt2 — the stress falls on “I” and “It” (contrast), not on “don't” or “suck”
// REVIEW 2026-11-16: pass 5, fix 14, drop 1, new 0; ear checks 2
// Open: nt2 — if the ear hears “I DON'T suck. IT sucks.”, the key is wrong; retire nt2 rather than re-key it.
import type { Clip } from '../types.ts';

export const pacMan: Clip = {
  id: 'pacman', video: 'VpYhLMub418', title: 'Phoebe Is Hogging Ms. Pac-Man', dur: 65, wpm: 157, band: 'mid',
  tags: ['友だち', '家'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): only the key read the scene as silly; now two "silly" choices split on the ending
    // why: soon see it too ← "Okay, maybe that's it" heard as the players giving in; unfair to Monica ← her "I said I
    //   was next" heard as the scene's verdict
    { id: 'g1', skill: 'gist', level: 'B2', point: 'serious', reveals: ['clark'], seg: [0, 54],
      stem: 'Across the scene, how do the others see the fight over the game?',
      choices: ['As silly, while the two players take it hard', 'As silly, and the two players soon see it too',
                'As unfair to Monica, who keeps asking for a turn'], a: 0,
      cue: '「stupid game」や Clark bar など、周りの一言。',
      said: 'Chandler は「くだらない」と言い、別の人も「お菓子も出ないのに」と冷やかす。',
      mean: '周りは本気にしていない。真剣なのは Monica と Phoebe だけ。',
      trap: 'maybe that’s it で折れたと取りやすいが、最後まで「どいて」が続く。',
      use: 'Guys, it’s just a game.（みんな、ただのゲームだよ）' },

    // R fix: V2 (blind 65 %): the key was the only insincere reading; now two choices are "fake pity"
    // why: hide surprise ← "would you look at that" heard as her own amazement; real pity, glad to win ← "sad" taken
    //   literally, in the Japanese 気づかい frame, with the win half-heard
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'howsad', seg: [0, 9.1],
      stem: 'Right after her new record, how does Phoebe mean her “How sad”?',
      choices: ['As fake pity, to rub in her big win', 'As fake pity, to hide how surprised she is',
                'As real pity, though she is glad to win'], a: 0,
      cue: '「Yes!」と「would you look at that」の勢い。',
      line: 'Oh, *would you look at that*, Monica? … *How sad*.',
      said: '「見てよ、Monica。全部抜いちゃった。かわいそうに」と言う。',
      mean: '勝ちを見せつけたあとの「かわいそう」は、うれしさを隠さない偽の同情。',
      trap: 'look at that は驚きにも聞こえるが、Monica への見せつけ。直前の Yes! を聞く。',
      use: 'Oh no, I won again. How sad.（あら、また勝っちゃった）' },

    // R fix: V2 (blind 70 %): "tied" and "by mistake" were weak; now "every one" is shared and "a few" tests "all"
    // why: a few ← "top" caught and "all" missed; erased ← "knocked off" read literally as removing them
    { id: 'd1', skill: 'detail', level: 'B1', point: 'scores', seg: [3, 9.1],
      stem: 'What has Phoebe just done to Monica’s scores on the game?',
      choices: ['Beaten every one of them', 'Beaten a few of them', 'Erased every one of them'], a: 0,
      cue: 'Monica の名前のすぐあと。',
      line: 'I just *knocked off all your top scores*.',
      said: 'Monica に「あなたの上位スコアを全部塗りかえた」と言う。',
      mean: 'knock off ＝ ここでは上位から落とす。自分の記録が上を全部占めた。',
      trap: 'off から「消した」と取りやすいが、勝って順位から落とした意味。all も聞きのがさない。',
      use: 'She knocked me off the top spot.（彼女に1位を取られた）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'next', seg: [10, 13.4],
      stem: 'Type what Monica says: “No, don’t start another game. ___.” (5 words)', answer: 'i said i was next',
      cue: '「another game」のあと。短い語がつながる。',
      line: 'No, don’t start another game. *I said I was next*.',
      said: '「次のゲームを始めないで。次は私って言ったでしょ」。',
      mean: 'さっきの「I’m next」を言い直して、順番をはっきり主張している。',
      trap: 'said I と was が弱くつながり「セダイワズ」に近い。I が2回あるのを落とさない。',
      use: 'I said I was next in line.（次は私って言ったよ）' },

    // R fix: V2 (blind 60 %): parallel rewording, so the key is no longer the only "as if" choice
    // why: game's beeps ← "couldn't hear you over" taken at face value, with an arcade in mind and "winning" missed;
    //   sorry ← "I'm sorry" heard as a real apology
    // R fix (also): its line shows s1's answer, so it reveals couldnt
    { id: 'h1', skill: 'humor', level: 'C1', point: 'winning', reveals: ['couldnt'], seg: [12.9, 17.9],
      stem: 'When Monica shouts her name, why does Phoebe’s answer get a laugh?',
      choices: ['She treats her winning like a loud noise', 'She blames the game’s beeps for not hearing',
                'She sounds sorry, as if she really means it'], a: 0,
      cue: '「hear you over」のあと、何の音？',
      line: 'Oh, I’m sorry. I couldn’t hear you *over all the winning*.',
      said: '「ごめん、勝ちまくってる音で聞こえなかった」と言う。',
      mean: 'hear you over のあとは本来「騒音」。そこに winning を入れて勝ちを自慢。',
      trap: 'I’m sorry を本気の謝罪と取りやすい。over のあとに何が来るかで冗談だと分かる。',
      use: 'Sorry, I couldn’t hear you over the music.（音楽で聞こえなかった）' },

    // why: could ← the t drops and the n is faint; can / can't ← the present forms, with the vowel blurred
    { id: 's1', skill: 'sound', level: 'B2', point: 'couldnt', reveals: ['winning'], seg: [13.9, 17.9],
      stem: 'Fill the gap: “Oh, I’m sorry. I ___ hear you…”',
      choices: ['can', 'could', 'couldn’t', 'can’t'], a: 2,
      cue: 'hear の直前、短い語の終わり方。',
      line: 'I *couldn’t* hear you over all the winning.',
      said: '「（勝ちの音で）聞こえなかった」と言う。',
      mean: '過去の否定 couldn’t。t はほぼ消え、「クドゥン」と n の音だけが残る。',
      trap: 't が消えると could に聞こえる。小さな鼻音の n が残っていれば否定と考える。',
      use: 'I couldn’t hear you. Say again?（聞こえなかった。もう一回？）' },

    // why: who is upset ← "who" taken as a real question; take care of it ← "cares" read as 世話をする / 対処する
    { id: 'ph1', skill: 'phrase', level: 'B1', point: 'whocares', seg: [17.7, 22],
      stem: 'When Monica turns to Chandler, what does his first reply mean?',
      choices: ['I don’t care about it', 'Tell me who is upset', 'Someone should take care of it'], a: 0,
      cue: '名前を呼ばれた直後の、短い返事。',
      line: '*Who cares?* It’s a stupid game.',
      said: '「どうでもいいよ。くだらないゲームだし」と返す。',
      mean: 'Who cares? は答えを求めない質問で「誰も気にしない＝どうでもいい」。',
      trap: 'who を本当の質問と取ると「誰が困ってるの？」になる。語尾が上がっても答えは要らない。',
      use: 'Who cares what they think?（人がどう思おうと関係ない）' },

    // why: Monica ← she has done the complaining so far, so her voice is expected; Phoebe ← she was named just before
    //   and is the one at the machine
    { id: 'w1', skill: 'who', level: 'B2', point: 'whosucks', reveals: ['suckat'], seg: [19.9, 29.9],
      stem: 'Who answers “I don’t suck”?',
      choices: ['Chandler Bing', 'Monica Geller', 'Phoebe Buffay'], a: 0,
      cue: '「you suck at it」と言われたのは誰？',
      line: '…’cause you suck at it. — *I don’t suck*. It sucks.',
      said: '「下手だから」と言われた人が「下手じゃない、ゲームがダメなんだ」と返す。',
      mean: '責められたのは「くだらない」と言った人。言い返すのも同じ人で、Chandler。',
      trap: 'Monica がずっと話しているので同じ声と思いやすい。誰が言われたのかを追う。',
      use: 'I’m not bad at it. It’s just hard.（下手じゃない、難しいだけ）' },

    // R fix: V2 (blind 55 %): "he's bad at it" was the stock sitcom answer; all three now give a personal reason
    // why: too easy ← "stupid" heard as 簡単すぎる; no turn ← Monica's "hogging" complaint just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'suckat', seg: [20.2, 25.4],
      stem: 'According to the reply, why does Chandler call the game stupid?',
      choices: ['Because he can’t play it well', 'Because he can’t get a turn on it', 'Because it’s too easy for him'],
      a: 0,
      cue: '「only think」のあと、cuz に続く部分。',
      line: 'you only think it’s stupid *’cause you suck at it*.',
      said: '「下手だからくだらないと思うだけでしょ」と言い返す。',
      mean: 'suck at ～ ＝ ～がすごく下手。けなすのは負けているから、という指摘。',
      trap: 'stupid を「簡単すぎる」と取りやすい。理由は cuz（because）のあとに来る。',
      use: 'I suck at bowling.（ボウリングは全然だめ）' },

    // R fix: V2 (blind 60 %): the key was the only choice with a contrast reason; the distractors' reasons now match it
    // why: on "don't" ← a denial usually stresses the negative; on both "suck"s ← he throws her word back, so the echo
    //   seems to carry the weight
    // anchor: 22.4–24.7 s “you suck at it” makes him the subject; 25.7–27.5 s he keeps “suck” and swaps the subject, so
    //   the contrast is I against it
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'itsucks', reveals: ['whosucks'], seg: [20.3, 28.3],
      stem: 'In “I don’t suck. It sucks.”, where does the stress fall, and why?',
      choices: ['On “I” and “It”: one subject set against the other', 'On “don’t”: a flat denial of what she just said',
                'On both “suck”s: her own word thrown right back'], a: 0,
      cue: '2つの文で、入れ替わった語。',
      line: '*I* don’t suck. *It* sucks.',
      said: '「僕がダメなんじゃない。ゲームがダメなんだ」と、主語に力を込めて言う。',
      mean: 'suck は残し、主語だけを入れ替える。対比の強勢は主語に乗り、日本語の「は」に近い働きをする。',
      trap: '否定の don’t を強めると「下手じゃない」だけの意味になる。何と何を比べているかで強勢の位置が決まる。',
      use: 'I’m not wrong. YOU are.（間違ってるのは私じゃなくて、あなた）', retired: true },

    // R fix: V2 (blind 75 %): only the key mentioned the game; now all three do. Its stem quotes d2's key, so it
    //   reveals suckat
    // why: owns up ← "don't" lost, so "I suck" sounds like an admission; too hard ← "it sucks" heard as the game being
    //   too hard for anyone, the wrong implication
    { id: 'h2', skill: 'humor', level: 'C1', point: 'itsucks', reveals: ['whosucks', 'suckat'], seg: [21.9, 28.3],
      stem: 'Why does Chandler’s answer to “you suck at it” get a laugh?',
      choices: ['He shifts the blame from himself onto the game', 'He owns up to it, but blames the game as well',
                'He says the game is too hard for anyone to play'], a: 0,
      cue: 'suck が2回。主語の違いに注目。',
      line: '*I* don’t suck. *It* sucks.',
      said: '「僕がダメなんじゃない。ゲームがダメなんだ」と返す。',
      mean: '同じ suck で主語だけ It に替え、悪口をゲームに押しつける子どもっぽさ。',
      trap: 'don’t の t が消えると、認めたように聞こえる。主語の I と It を聞き分ける。',
      use: 'I’m not late. The bus is.（遅れたのは私じゃない、バスだ）' },

    // why: doesn't like it ← the offer to keep it heard as the giver sensing it isn't wanted; stupid game ← Chandler's
    //   words, said just before
    // R fix: V5: the reason takes the whole if-clause turn (B2), which also keeps B1 ≤ 35 % after r1's drop
    { id: 'd4', skill: 'detail', level: 'B2', point: 'problems', seg: [32.3, 37.6],
      stem: 'Why does the friend offer to keep the game?',
      choices: ['It’s causing fights between them', 'They don’t seem to like it much', 'Chandler says it’s a stupid game'],
      a: 0,
      cue: '「if this game」に続く条件。',
      line: 'if this game is gonna *cause problems between the two of you*, then maybe I should just keep it.',
      said: '「二人がもめるなら、持って帰ろうか」と言う。',
      mean: 'cause problems ＝ もめごとの種になる。けんかの元を取り除こうという申し出。',
      trap: 'stupid game が直前に聞こえるので、それを理由と取りやすい。理由は if のあとにある。',
      use: 'If it’s a problem, I’ll take it back.（迷惑なら引き取るよ）' },

    // R fix: V2 (blind 55 %): "buy" was a filler; now two loan-type distractors
    // why: on loan ← "keep it" heard as taking back something lent; for the day ← "go home" heard as the visit ending
    { id: 'i2', skill: 'infer', level: 'B2', point: 'gift', reveals: ['love'], seg: [32.3, 40.2],
      stem: 'From the offer and the answer to it, what do we learn about the game?',
      choices: ['It was a present the friend gave them', 'It was on loan, and he’d like to keep it now',
                'It was brought over just for the day'], a: 0,
      cue: '答えの最後に出てくる名詞。',
      line: 'maybe I should just *keep it*. — No, no, no… It is a great *present*.',
      said: '「持っておこうか」に「だめ、すてきなプレゼント」と返る。',
      mean: 'keep it ＝ 渡さず手元に置く。present と合わせると、贈り物を引き上げる話。',
      trap: 'keep を「貸した物を返してもらう」と取りやすい。返事の present が手がかり。',
      use: 'Keep it. It’s a gift.（持ってて。プレゼントだから）' },

    // R fix: V2 (blind 60 %): "alarm… rush" stood out; the choices are now short manner-plus-reason pairs
    // why: gladly ← the offer would end the fight, and "I love it" is heard without the No's; politely ← "I love it.
    //   It is a great present" heard as the thank-you of a 遠慮 refusal
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'love', reveals: ['gift'], seg: [32.3, 40.2],
      stem: 'When the friend offers to keep the game, how is the offer met?',
      choices: ['Quickly, afraid of losing the game', 'Politely, so the friend won’t feel bad',
                'Gladly, since the fight could end there'], a: 0,
      cue: '答えの最初、No の数と速さ。',
      line: '*No, no, no. No, I love it*. It is a great present.',
      said: '「だめだめ、大好きよ。すてきなプレゼント」と、すぐに打ち消す。',
      mean: 'No を4回重ねて、取り上げられまいとする。けんかより、ゲームを失うほうがいや。',
      trap: 'I love it を遠慮のお礼と取りやすい。No の重ね方と速さに本気が出ている。',
      use: 'No, no, I love it!（いやいや、すごく気に入ってる！）' },

    // R drop: r1 (predict) — S5: only ≈ 0.15 s between "present" (39.2 s) and "But" (39.7 s), so no cut can stop
    //   ≥ 0.3 s before the continuation without clipping "present"; pr2 and nt1 already test the same "but" move
    // R fix: V2 (blind 70 %): two literal fillers; now "not to worry" is a second non-literal reading
    // why: card ← "wait for the thank-you card" taken at face value; not to worry ← "go home and wait" heard as
    //   reassurance after the offer about the fight
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'thankyou', seg: [37, 44.1],
      stem: 'What is the line about the thank-you card really doing?',
      choices: ['Asking the friend, nicely, to leave now', 'Telling the friend, nicely, not to worry',
                'Promising the friend, nicely, a card soon'], a: 0,
      cue: '「why don’t you」のあとの動詞。',
      line: '*why don’t you go home* and wait for the thank-you card?',
      said: '「家に帰って、お礼のカードを待ってたら？」と言う。',
      mean: '形は提案だが、中身は「もう帰って」。贈り主がいなければ取り返されない。',
      trap: 'card から感謝、wait から「気にしないで」と取りやすい。go home が本題。',
      use: 'Why don’t you head home and rest?（もう帰って休んだら？）' },

    // R fix: V2 (blind 60 %): the key's "I get it" restated the stem's "understood"; now no choice says so
    // why: no card needed ← answering the line's form (the thank-you), the sincerity flip; take it back ← "I love
    //   it" heard as 遠慮 that really means yes
    // anchor: 37.0–39.2 s “No, no, no. No, I love it” refuses the offer; 39.7–41.5 s “But… why don't you go home”: the
    //   “but” after the praise marks the request, and the card is only the excuse
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'thankyou', reveals: ['love'], seg: [37, 44.1],
      stem: 'Which reply from the friend would show the hint was understood?',
      choices: ['“Right, I’ll get going, then.”', '“Oh, you don’t have to send a card!”', '“So you want me to take it back?”'],
      a: 0,
      cue: '「But」のあと、何を頼んでいる？',
      line: 'No, I love it… *But*… *why don’t you go home*…',
      said: '「大好き。でも、家に帰ってお礼状を待ってたら？」と返す。',
      mean: '返事は言葉の形でなく、頼まれた行動に返す。ここで頼まれているのは帰ること。カードは帰らせる口実。',
      trap: 'カード不要と答えるのは形への返事。遠慮と取って「やっぱり持ち帰る？」と聞くのも、No の連打が打ち消している。',
      use: 'Got it, got it. I’m leaving.（分かった分かった、帰るよ）', retired: true },

    // R fix: V2 (blind 50 %): the choices now differ in how firmly they move her, which "Get out of the chair" settles
    // why: finish this game ← "Okay, maybe that's it" heard as giving in; kindly, a break ← "Come on" heard as a gentle
    //   coax, the Japanese softener frame
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['chair'], seg: [37, 54.5],
      stem: 'By the end of the clip, how are they dealing with Phoebe?',
      choices: ['Ordering her out of her seat', 'Asking her kindly for a break', 'Letting her finish this game'], a: 0,
      cue: '最後の「come on」の連続。',
      line: 'Come on. *Get out of the chair*.',
      said: '「ほら、椅子からどいて」と何度も言い、Phoebe をどかそうとする。',
      mean: '頼むのをやめ、どかしにかかる段階。順番争いは最後まで続く。',
      trap: 'maybe that’s it で折れたと取りやすい。come on の連続と命令の形が、頼みでなく追い出し。',
      use: 'Come on, give someone else a turn.（ほら、ほかの人にも順番を）' },

    // R fix: V2 (blind 55 %): the key was the only negative; now "no candy now, though it used to" is negative too
    // why: used to ← "it's not like" half-heard as a past contrast; every game ← "spits out a Clark bar" heard
    //   without "it's not like"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'clark', seg: [43.9, 49.5],
      stem: 'What does the remark about a Clark bar suggest?',
      choices: ['It gives no prize, so why care so much', 'It gives no candy now, though it used to',
                'It gives out candy after every game'], a: 0,
      cue: '「it’s not like」のあと。',
      line: 'Yeah, *it’s not like* it spits out a Clark bar after every game.',
      said: '「毎回お菓子が出るわけでもないのに」と言う。',
      mean: 'it’s not like ＝ ～でもあるまいし。ごほうびもないのに、という冷やかし。',
      trap: 'Clark bar からお菓子が出ると取りやすい。冒頭の三語が全体を打ち消す。',
      use: 'It’s not like it’s free, you know.（タダってわけじゃないんだよ）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'chair', seg: [50.4, 53.6],
      stem: 'Type the last words: “Come on. Come on. ___.” (4 words)', answer: 'out of the chair',
      cue: '最後の「come on」2回のあと。',
      line: 'Come on. Come on. *Out of the chair*.',
      said: '「ほら、ほら、椅子からどいて」と促す。',
      mean: 'Get を省いた命令。Out of ～ だけで「～から出て」になる。',
      trap: 'out of がつながり「アウダ」に近く、of が消えやすい。4語の数で確かめる。',
      use: 'Out of the way, please!（ちょっとどいて！）' },
  ]
};
