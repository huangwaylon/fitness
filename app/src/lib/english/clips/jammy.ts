// “Discovering Jammy | Parks and Recreation” (the official Parks and Recreation channel, Season 7): Leslie visits her old
// council colleague Jeremy to win his deciding vote against rezoning the Newport land; he defers to his new girlfriend,
// Tammy, which horrifies Leslie until she sees that their dislike of Ron gives her an opening; to camera, she admits
// she is siding with terrible people for the sake of a national park.
// Segments from the captions, words from whisper (2026-11-16). Talk runs ≈ 4–99.4 s; music after. Names said: Knopey
// (4.2 s, captions "nope"), Jeremy (7.8, 30.6 s), Ron (19.3, 73.5, 77.1, 79.7 s), Leslie (44.9 s), Tammy (47.4, 49.5 s).
// Untested on purpose: 0–7.4 s (the greeting and "I just farted"), 27.2–31.5 s ("gas station sushi": needs world
// knowledge), 36–37.7 s (whisper "Whoa, whoa, whoa… little chica", captions "a little chica"), 42–52 s (who says
// "Hello, Leslie", "Tammy", "Jammy"; captions "jamie"), whom "you" means at 75.8 and 79.0 s (Tammy or both; no key rests on it),
// 82.5–84.3 s ("let me mull it over": speaker and tone unclear), 99.4–107 s (whisper "see you next time… bye-bye" over
// the music; the captions have [Music]).
// REVIEW 2026-11-16: pass 6, fix 14, drop 0, new 0; ear checks 1
// REVIEW: x1 came off the ear-check list: both sources agree on the words (GUIDE §9.7).
// EAR CHECK: 84.5 s m1 i2 nt2 — assumed Leslie's talking head to camera ("terrible people", "you can trust my opinion"); the
//   words point to it, the sources can't show it
import type { Clip } from '../types.ts';

export const discoveringJammy: Clip = {
  id: 'jammy', video: 'SLJaQH3I-HQ', title: 'Discovering Jammy', dur: 120, wpm: 146, band: 'slow',
  tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 55 % ("make peace" was weak); three parallel aims about the vote now
    // why: vote for ← "build" is said, with the "can't" before it lost; sit out ← "the deciding vote is from…" heard as
    //   a vote she'd rather he didn't cast
    { id: 'g1', skill: 'gist', level: 'B2', point: 'vote', reveals: ['zone'], seg: [6.9, 36.5],
      stem: 'Why has Leslie come to see Jeremy?',
      choices: ['To get his vote against the building plan', 'To get his vote for the building plan',
                'To get him to sit out the land vote'], a: 0,
      cue: '「So, I am here」のあとに続く言葉。',
      line: 'I am here to talk to you about *why you should vote no*…',
      said: '議会の採決の話のあと、「反対票を入れるべき理由を話しに来た」と切り出す。',
      mean: '目的は彼の票。仲直りではなく、土地の案を止めたい。',
      trap: 'can’t build の can’t が消えると賛成に聞こえる。本題は I am here to のあと。',
      use: 'I’m here to talk about the rent.（家賃のことで話しに来ました）' },

    // R fix: V2, blind 55 % (h1's stem cued a rude opener; "never remember her" was weak)
    // why: sorry they lost touch ← "never… again" heard as regret over the lost years; afraid ← "Oh, Jeremy" heard as
    //   a nervous sigh
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'never', seg: [6.9, 12.15],
      stem: 'How does Leslie feel about seeing Jeremy again?',
      choices: ['She’d hoped she was rid of him for good', 'She is sorry they lost touch for so long',
                'She is afraid he is still angry at her'], a: 0,
      cue: '「Oh, Jeremy」のあとの一文、never の先。',
      line: 'I truly thought that I would *never have to interact with you again*.',
      said: '「もう二度と関わらなくていいと本気で思ってた」と言う。',
      mean: 'never have to ＝ 〜しなくて済む。会いたくなかった本音。',
      trap: 'never … again だけだと「会えなくて寂しい」にも聞こえる。have to まで聞いて決める。',
      use: 'I hoped I’d never see this again.（二度と見たくなかった）' },

    // R fix: V2, blind 60 % (the only comic choice); the choices now differ only in what his "too" answers
    // why: sorry ← her "truly thought" heard as an apology's opening; meet again ← "too" heard as agreeing about meeting
    { id: 'h1', skill: 'humor', level: 'C1', point: 'missed', reveals: ['never'], seg: [6.9, 12.15],
      stem: 'After Leslie’s first words to Jeremy, why is his reply funny?',
      choices: ['He replies as if she’d said she missed him', 'He replies as if she’d said she was sorry',
                'He replies as if she’d agreed to meet again'], a: 0,
      cue: '彼女の言葉と、返事の最後の一語。',
      line: '…*never have to interact with you again*. — *I missed you, too.*',
      said: '「二度と関わらずに済むと思ってた」に「僕も会いたかった」と返す。',
      mean: 'きつい言葉を「会いたかった」と聞いたかのように、too で返している。',
      trap: '返事の頭だけでは何への返事か分からない。最後の too が何を受けるかを聞く。',
      use: 'I missed you too, you know.（私も会いたかったんだよ）' },

    // why: homes ← "re-zone… land" caught, "commercial" lost; sold to Ron ← Ron is named just after, with "build
    //   anything there"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'zone', seg: [11.55, 21.1],
      stem: 'What is the city council voting on?',
      choices: ['Whether the Newport land can be used for business', 'Whether homes can be built on the Newport land',
                'Whether the Newport land should be sold to Ron'], a: 0,
      cue: '「whether」のあと、文の最後の二語。',
      line: 'voting on whether to *re-zone the Newport land for commercial use*.',
      said: '市議会が、ニューポートの土地を商業用にするかを採決する。',
      mean: 're-zone ＝ 土地の用途を変える。commercial use は店や会社用。',
      trap: 're-zone だけでは住宅か店か分からない。最後の for のあとを聞く。',
      use: 'Is this area zoned for business?（ここは商業地区ですか）' },

    // why: selling ← "Grizzle" heard as a buyer next to Ron; voting ← "the city council is voting" said just before
    { id: 'd4', skill: 'detail', level: 'B1', point: 'build', reveals: ['vote'], seg: [16.65, 21.1],
      stem: 'What would Leslie’s win stop Ron from doing?',
      choices: ['Building anything on the land', 'Selling the land to a company', 'Voting on the land at all'], a: 0,
      cue: '「If I win」のあと、名前に続く動詞。',
      line: 'If I win, stupid Grizzle and stupid Ron *can’t build anything there*',
      said: '「私が勝てば、Grizzle と Ron はあそこに何も建てられない」。',
      mean: '勝てば建てる計画が止まる。Ron は建てたい側。',
      trap: 'Grizzle を買い手と思うと「売る」話に聞こえる。動詞まで聞く。',
      use: 'If I win, drinks are on me.（勝ったらおごるよ）' },

    // R fix: V2, blind 55 %, and K1: "sit back and relax" was close to defensible for "sitting pretty"
    // why: a seat ← "sitting" read literally, with the council just mentioned; look good ← "pretty" taken as looks
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'pretty', seg: [16.65, 22.45],
      stem: 'When Leslie says where a win would leave her, what does she mean?',
      choices: ['She would be in a very good spot', 'She would get a seat on the council',
                'She would look good to the voters'], a: 0,
      cue: '「and then」のあとの二語。',
      line: '…and then *I’m sitting pretty*.',
      said: '「勝てば、そのあと私は安泰」と言う。',
      mean: 'sitting pretty ＝ 有利で安心な立場。座ることとも見た目とも無関係。',
      trap: '一語ずつ訳すと「座る」「かわいい」になる。二語でひとかたまり。',
      use: 'With this deal, we’re sitting pretty.（この契約で、うちは安泰だ）' },

    // R fix: V2, blind 60 % ("tell her how the others vote" was weak)
    // why: leads ← "deciding" heard as the person who decides, like a chair; ally ← "my old city councilmate" heard as
    //   a friend, the "Sadly" before it lost
    { id: 'd2', skill: 'detail', level: 'B1', point: 'decide', seg: [22.0, 32.0],
      stem: 'Why does Leslie need Jeremy in particular?',
      choices: ['His vote is the one that decides it', 'He was her closest ally on the council',
                'He is the head of the city council'], a: 0,
      cue: '「Sadly」のあと、文の主語の部分。',
      line: 'Sadly, *the deciding vote* is from my old city councilmate…',
      said: 'あいにく決め手の一票は、昔の議会仲間の Jeremy にある。',
      mean: 'deciding vote ＝ 結果を決める一票。だから彼を説得したい。',
      trap: 'deciding を「決める人」と取ると議長に聞こえる。Sadly で仲間でないとも分かる。',
      use: 'You have the deciding vote.（決めるのはあなたの一票です）' },

    // why: slow down ← "hold up" known as "wait"; made up his mind ← "before we go any further" heard as refusing to hear
    //   more
    { id: 'r1', skill: 'pragma', level: 'B2', point: 'holdup', reveals: ['vote'], seg: [32.0, 41.85],
      stem: 'When Jeremy speaks up during Leslie’s pitch, what is he doing?',
      choices: ['Stopping her before she can make her case', 'Asking her to slow down and say it again',
                'Hinting that he has already made up his mind'], a: 0,
      cue: 'Leslie の話が切れたあと、彼の最初の二語。',
      line: '…why you should vote no… — *Hold up*… *Before we go any further*…',
      said: 'Leslie が理由を話し始めたところで、Jeremy が「ちょっと待った。話を進める前に」と止める。',
      mean: 'hold up ＝ 待って。話をさえぎり、先に自分の用を出す。',
      trap: '「待って」を言い直しの頼みと取りやすい。このあと別の用件が来る。',
      use: 'Hold up, I need to grab my wallet.（ちょっと待って、財布取ってくる）' },

    // R fix: V2, blind 55 %; the choices are now mirror images, so the order of the turn decides it
    // why: reversed ← "Dear God, why?" comes after the friendly start, heard as the end point; argument ← the cold
    //   "Hello, Leslie. — Tammy." heard as the start of a row
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['jammy', 'girl'], seg: [32.0, 92.75],
      stem: 'How does the meeting turn for Leslie?',
      choices: ['A setback turns into an opening', 'An opening turns into a setback',
                'A setback turns into an argument'], a: 0,
      cue: '「Dear God, why?」と「Wait a second」の差。',
      line: '*Wait a second. This is great news*…',
      said: '恋人が Tammy と知ってうろたえるが、Ron が共通の敵だと気づき「いい知らせ」と言う。',
      mean: '最初の壁が、後半で突破口に変わる。',
      trap: '途中の嘆きだけ覚えていると失敗の話に聞こえる。最後まで聞く。',
      use: 'Wait a second, this could work.（待って、これいけるかも）' },

    // R fix: V2, blind 55 % ("hear all her reasons" was weak); all three now involve the girlfriend
    // why: tell ← "my girlfriend" and "vote" caught, the direction ("ask… how she wants") lost; talk to Leslie ← the
    //   jealous-girlfriend script, with "Who's your girlfriend?" right after
    { id: 'd3', skill: 'detail', level: 'B1', point: 'girl', seg: [37.3, 41.9],
      stem: 'What does Jeremy say he must do before going on?',
      choices: ['Ask his girlfriend how she wants him to vote', 'Tell his girlfriend which way he plans to vote',
                'Ask his girlfriend if he may talk to Leslie'], a: 0,
      cue: '「Before we go any further」のあと。',
      line: 'I need to *ask my girlfriend how she wants me to vote*.',
      said: '「進む前に、彼女にどう投票してほしいか聞かないと」。',
      mean: '票は恋人まかせ。説得する相手が変わった。',
      trap: 'girlfriend と vote だけ拾うと「彼女に伝える」に聞こえる。ask … how she wants で向きが決まる。',
      use: 'Let me ask my wife first.（まず妻に聞かせて）' },

    // R fix: V2, blind 55 % ("surprise to joy" was weak); the third is now the same two moves reversed
    // why: curiosity ← "When did you—" heard as a real question; reversed ← "Wow" and "Jammy" at the start heard as
    //   disbelief, "so cute" as where she ends
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'jammy', seg: [52.6, 59.8],
      stem: 'As Leslie reacts to the couple, how does her tone shift?',
      choices: ['From polite praise to open disbelief', 'From polite praise to real curiosity',
                'From open disbelief to polite praise'], a: 0,
      cue: '「cute」のあと、言いかけてやめる所。',
      line: 'You guys are *so cute*. When did you — *Why would either one of you*… *Dear God, why?*',
      said: '「かわいい。いつから…」と言いかけ、「なんで？ああ、なんで？」と崩れる。',
      mean: '礼儀のほめ言葉が止まり、本音の「信じられない」が出る。',
      trap: 'When did you は本当の質問に聞こえるが、途中で切れる。言いかけてやめた文は本音の合図。',
      use: 'Wait, you two? Since when?（え、二人が？いつから？）' },

    // why: fight ← "hit" taken literally, with karaoke and "bite the door guy" around it; duet ← karaoke plus "she saw me nail" a song
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'hitoff', seg: [59.6, 66.4],
      stem: 'How does Jeremy say things began between him and Tammy?',
      choices: ['They got on well from the very start', 'They got into a fight over a song',
                'They sang a duet together on the stage'], a: 0,
      cue: '最初の三語のつながりと、そのあとの話。',
      line: '*Hit it off*… karaoke.',
      said: '「カラオケで意気投合した」と、出会いを話し始める。',
      mean: 'hit it off ＝ 会ってすぐ気が合う。殴る（hit）とは関係ない。',
      trap: 'hit を「たたく」と取ると、直後の bite とつながりケンカに聞こえる。三語でひとまとまり。',
      use: 'We really hit it off at the party.（パーティーですっかり意気投合した）' },

    // R fix: V2, blind 55 % ("nothing much happened" was weak)
    // why: ended long ago ← "the rest is history" heard as "it's all in the past" (歴史 = 終わったこと); a dig ← "bite
    //   the door guy" heard as a jab at Tammy, not a highlight
    { id: 'h2', skill: 'humor', level: 'C1', point: 'story', seg: [61.6, 71.3],
      stem: 'Why does Jeremy’s story of how they got together get a laugh?',
      choices: ['It’s told as a romance, but the highlights are awful', 'It’s told as a romance, but it ended long ago',
                'It’s told as praise, but it’s really a dig at Tammy'], a: 0,
      cue: 'それぞれの場面の中身と、締めの決まり文句。',
      line: 'She saw me *nail Gangsta’s Paradise*. I saw her *bite the door guy*. She then *let me buy her a bunch of purses*…',
      said: '「僕の熱唱を彼女が見て、彼女が用心棒にかみつくのを僕が見た。バッグも買わせてくれた」。',
      mean: '恋の始まりの語り方で、中身はかみつきと貢ぎ物。本人はいい思い出のつもり。',
      trap: 'bite を悪口と取りやすいが、「見た」が並ぶ形はほめ合い。',
      use: 'Long story short, we got married.（かいつまんで言うと、結婚したんだ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'history', reveals: ['story'], seg: [68.3, 71.4],
      stem: 'Type what Jeremy says: “…and ___.” (4 words)', answer: 'the rest is history',
      cue: '「purses」のあと、話の締めくくり。',
      line: 'She then let me buy her a bunch of purses, and *the rest is history*.',
      said: '「それから先は、ご存じのとおり」と締める。',
      mean: 'その後はみんな知っての通り。恋や成功の話の決まった締め。',
      trap: 'rest と is がつながり「レスティズ」のように聞こえる。is が消えたように感じても4語。',
      use: 'We met in Paris. The rest is history.（パリで出会って、あとはご存じのとおり）' },

    // R fix (C2, one rewrite): V2, blind 50 % (i2's choices give the key away; "change of heart" was weak). The
    //   choices now pair sincere/insincere with a reason; if a fresh read still splits, drop it.
    // why: an act ← "I'm aligning myself" missed, so the cheerful pitch is heard as a con; won over ← "Thank you"
    //   and the bright "great news" taken at face value
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'align', reveals: ['sure', 'turn'], seg: [71.3, 92.75],
      stem: 'After her comment to the camera, how should we hear Leslie’s “great news”?',
      choices: ['Sincere: she’ll truly side with people she finds awful', 'Insincere: she’s only pretending, to trick them',
                'Sincere: the couple have truly won her over'], a: 0,
      cue: '場面の明るい声と、カメラへの一言の差。',
      line: '*This is great news*… — *Sure, I’m aligning myself with terrible people.* … *It’s worth it.*',
      said: '場面では「いい知らせ」と明るく持ちかけ、カメラには「ひどい人たちと組む。でも公園のためなら価値がある」と話す。',
      mean: 'カメラへの一言が場面を書きかえる。明るさは好意でなく、嫌な相手と承知で結ぶ取引。',
      trap: '場面の口調で決めない。カメラへの一言が答え合わせ。「組む」と「好き」は別。',
      use: 'We don’t like them, but we need them.（好きじゃないけど、必要な相手）' },

    // why: love to ← the same sense with a near vowel (/ɪ/ vs /ʌ/); lived to ← a past tense heard in the t of "to"
    { id: 's1', skill: 'sound', level: 'B2', point: 'live', seg: [73.45, 77.75],
      stem: 'Fill the gap: “And you ___ torture Ron.”',
      choices: ['live to', 'love to', 'lived to'], a: 0,
      cue: '「you」のすぐあと、動詞の母音。',
      line: 'Ron is my opponent in this, and you *live to* torture Ron.',
      said: '「Ron は私の敵。そしてあなたは Ron をいじめるのが生きがい」。',
      mean: 'live to do ＝ 〜が生きがい。love to より強い言い方。',
      trap: 'love は「ア」に近く、live は短い「イ」。意味が近いので母音で聞き分ける。',
      use: 'He lives to talk about baseball.（彼は野球の話が生きがい）' },

    // R fix: V2, blind 50 %; the choices are now three reactions to the pitch
    // why: annoyed ← "bimbo" caught, "not… after all" lost (the t of "not" is soft); laughed off ← the insult heard
    //   as a jab that waves the pitch away
    { id: 'i1', skill: 'infer', level: 'B2', point: 'bimbo', seg: [77.65, 83.0],
      stem: 'What does the reply to Leslie’s pitch about Ron show?',
      choices: ['Her pitch is starting to land', 'Her pitch has annoyed them a little',
                'Her pitch is being laughed off'], a: 0,
      cue: '短い否定の語と、文の最後の二語。',
      line: 'Maybe you’re *not* a blonde bimbo *after all*.',
      said: '「頭の軽い金髪じゃないのかもね」と返され、Leslie は礼を言う。',
      mean: 'not … after all ＝ 思ったのと違った。失礼だが、認め始めた合図。',
      trap: 'bimbo だけ拾うと悪口に聞こえる。after all が「見直した」を示す。',
      use: 'Maybe you’re right after all.（やっぱり君が正しいのかも）' },

    // R fix: V2, blind 50 %
    // why: agrees ← "sure" as はい/もちろん, right after the scene's last lines; certain ← "sure" as 確か (I'm sure)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'sure', reveals: ['align'], seg: [84.3, 92.75],
      stem: 'In her comment to the camera, what does Leslie’s first word do?',
      choices: ['It grants a criticism, then answers it', 'It agrees with what the couple just said',
                'It shows she is certain the plan will work'], a: 0,
      cue: '最初の一語と、少しあとの but。',
      line: '*Sure*, I’m aligning myself with terrible people. *But* think of…',
      said: '「確かに、ひどい人たちと組む。でも公園で得をする人たちを考えて」。',
      mean: 'Sure は「確かに」と先に認める働き。本題は but のあと。',
      trap: 'sure を「はい」と取りやすい。文頭で but と組めば譲歩。',
      use: 'Sure, it’s pricey. But it lasts forever.（確かに高い。でも一生もつ）' },

    // R fix: V2, blind 65 % ("bitter enemy" was weak)
    // why: against Ron ← "aligning myself" heard as taking sides in the fight, and Ron was named as her opponent;
    //   businesses ← "benefit" heard as the business use the council votes on
    { id: 'i2', skill: 'infer', level: 'C1', point: 'align', reveals: ['sure'], seg: [84.3, 92.75],
      stem: 'In her comment to the camera, what does Leslie decide is worth it?',
      choices: ['Siding with people she thinks are awful', 'Turning against her old friend Ron',
                'Letting businesses use part of the land'], a: 0,
      cue: '「myself」の前後と、but のあと。',
      line: 'I’m *aligning myself with terrible people*. But… *a national park*. It’s worth it.',
      said: '「ひどい人たちと手を組む。でも国立公園を思えば価値がある」と言う。',
      mean: 'ひどい人たち＝さっきの二人。公園のためなら払う価値のある代償。',
      trap: 'align を「対立する」と取ると Ron の話に。align with ＝ 側につく。',
      use: 'It’s a long drive, but it’s worth it.（遠いけど、行く価値はある）' },

    // R fix (C2, one rewrite): V2, blind 70 % ("Taken seriously" cued the ironic reading). New stem and near misses.
    // why: never gives up ← "tunnel vision about achieving my goals" heard as drive, the reading a fluent learner
    //   reaches first; cares about the park ← "wonderful people who will benefit" just before
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'trust', seg: [91.6, 99.5],
      stem: 'What do Leslie’s two reasons to trust her say about her?',
      choices: ['That she’s too invested to judge fairly', 'That she will push hard and never give up',
                'That she cares more about people than Ron'], a: 0,
      cue: '「trust my opinion」のあとの二つの理由。',
      line: 'you can *trust my opinion* because I have *a lot to gain* by being right, and I have *severe tunnel vision*…',
      said: '「私は信用できる。正しければ得をするし、目標には視野がひどく狭いから」と言う。',
      mean: '信用の理由のつもりで、利害と視野の狭さを挙げる。本気で取れば「信用するな」。笑いの的は本人。',
      trap: 'tunnel vision を集中力と取りやすいが、severe なら欠点。理由が主張を裏切っていないか聞く。',
      use: 'Trust me, I’m totally unbiased.（信じて、全然えこひいきしてないから）' },
  ]
};
