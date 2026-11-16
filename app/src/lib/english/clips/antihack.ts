// “Donna's Anti-Hacking Trick Saves Leslie | Parks and Recreation” (the official Parks and Recreation channel,
// Season 5): Leslie works out that a reporter is reading her email, combs through it before a press conference, and
// with Donna's help catches the reporter out by planting a fake story.
// REVIEW 2026-11-16: pass 1, fix 21, drop 0, new 0; ear checks 1
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 218 s.
// (Removed in review: the "as a tribe" / "as a trap" ear check at 184.2 s; no key, line or choice uses the word.)
// Untested: "Ben and my" / "been in my" at 89.6 s (only a1's trimmed line is used); the undershirts line (49.6–56 s)
// and the "hooking up" exchange (186–198 s) are left out on content; "not too shabby" (captions) vs "not deja vu"
// (whisper) at 132 s; the Neve Campbell joke at 212 s needs a TV title.
// EAR CHECK: 139.8 s a3 — the stalled "I would… I would deny" is read as unsure (both sources have the repeat; the
//   key also stands on the conditional "would deny")
import type { Clip } from '../types.ts';

export const antiHack: Clip = {
  id: 'antihack', video: 'smlVXcfR9V8', title: 'Donna\'s Anti-Hacking Trick Saves Leslie', dur: 238, wpm: 172,
  band: 'fast', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %; only the key was about emails): all three choices are now about her emails
    // why: staff ← the clip opens on a lost speech and a staff member, so it sounds like a hunt for an inside leak;
    //   police ← "the police said they're gonna launch an investigation" heard as her plan
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['hacked'], seg: [0, 113.5],
      stem: 'Before the press event, what is Leslie mainly trying to do?',
      choices: ['Find anything in her sent emails that could hurt her',
                'Find out which staff member has been reading her emails',
                'Get the police to prove the paper hacked her emails'], a: 0,
      cue: 'メールの話が出てから、彼女が何をし始めるか。',
      said: '記者にメールを読まれていると気づき、送ったメールを全部見直して、使われそうなものを探す。',
      mean: '目的は犯人探しより、記者会見の前に自分の弱みを知っておくこと。',
      trap: '原稿と部下の話から犯人探しと取りやすい。警察の話は「1か月かかる」で終わる。',
      use: 'Let me go through my inbox first.（先に受信箱を確認させて）' },

    // why: suit ← "shoe" and "suit" open on a similar soft sound; shirt ← "safekeeping" suggests a breast pocket, and
    //   only the sh- is caught
    // R fix: S4 (the end cut into "Well, then" at 11.7 s): seg ends 11.65
    { id: 'd1', skill: 'detail', level: 'B1', point: 'shoe', seg: [2.6, 11.65],
      stem: 'Where had the missing speech been all along?',
      choices: ['Inside his shoe', 'Inside his suit', 'Inside his shirt'], a: 0,
      cue: '「I forgot」のあと、しまった場所。',
      line: 'I put it in *my shoe* for safekeeping. It’s a little *moist*…',
      said: '「なくしてない。靴の中にしまったのを忘れてた。少し湿ってるけど」と言う。',
      mean: 'for safekeeping ＝ なくさないように。湿っているのは靴の中だったから。',
      trap: 'shoe と suit は出だしが似ている。あとの moist が手がかり。',
      use: 'I put it here for safekeeping.（なくさないようにここに入れておいた）' },

    // R fix: V2 (blind 65 %; "printed a fake version" was a filler): distractors now doubt his story or keep the
    //   "lost" reading
    // why: lied ← she is cold to him ("Denied") and he had it all along, so she seems to doubt him; found ← "lose your
    //   speech" caught without "did not"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'leak', seg: [3.0, 13.4],
      stem: 'When the speech turns up, what does Leslie conclude?',
      choices: ['Kim must have got it some other way', 'He must have lied about losing it',
                'Kim must have found the copy he lost'], a: 0,
      cue: 'Well, then のあとの問いかけ。',
      line: 'Well, *then how did Kim get the speech?*',
      said: '「じゃあ、キムはどうやって原稿を手に入れたの？」と問う。',
      mean: 'なくしていないなら、別の経路で漏れたはず。ここから「誰かに見られている」という考えに進む。',
      trap: '本人のうそや、拾われたと取りやすい。原稿は靴の中。then は「それなら別の道で」。',
      use: 'Then how did they find out?（じゃあ、どうやって知ったの？）' },

    // R fix: V2 (blind 70 %; "race for votes" was weak): a distractor is now the usual paper-vs-politician script
    // why: following ← "step" taken literally, someone walking behind her; bad press ← the usual script of a paper
    //   against a politician
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'ahead', seg: [13.8, 17.6],
      stem: 'What does Leslie say the Pawnee Sun has been doing for months?',
      choices: ['Learning her news before she announces it', 'Following her around from place to place',
                'Printing stories that make her look bad'], a: 0,
      cue: '「for months」の前、たとえの言い方。',
      line: 'the Pawnee Sun has been *one step ahead of me* for months.',
      said: '「パウニー・サン紙は何か月も私の一歩先を行っている」と言う。',
      mean: 'one step ahead ＝ 相手より先に知っている。ここでは発表前に知られている。',
      trap: 'step を「足取り」と取ったり、新聞とのよくある対立と思い込んだりしやすい。続く例で確認。',
      use: 'They’re always one step ahead of us.（あの人たち、いつも一枚上手だ）' },

    // R fix: V2 (blind 80 %; "a show on TV" was a filler): a distractor is now the "announced" keyword trap
    // why: Ron ← "right after Ron emailed me" heard without "emailed", as Ron talking to the paper; meeting ←
    //   "before I even announced it" caught without "before"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'hacked', seg: [21.9, 33.2],
      stem: 'What do Leslie’s examples about Kim’s questions have in common?',
      choices: ['Each came soon after an email to Leslie', 'Each came soon after Ron talked to the paper',
                'Each came soon after she said it at a meeting'], a: 0,
      cue: '「right after」「moments after」のあと。',
      line: 'right after *Ron emailed me* about it… just moments after *Netflix did*.',
      said: '下水の件はロンのメールの直後、ドラマの件はネットフリックスの直後に聞かれた。',
      mean: 'どれもメールの直後に、記者が同じことを聞いた。読まれているという結論になる。',
      trap: 'ロンが話した、会議で言ったと取りやすい。after のあとの動詞まで聞く。',
      use: 'Right after I mentioned it, too.（しかも私が言った直後に）' },

    // R fix: V2 (blind 60 %; the sense alone ruled out "will"): a fourth sound-alike, "wouldn't"; S4 (the end cut
    //   "Jerry" at 41.4 s): seg ends 40.25
    // why: will ← the n't of "won't" fades and only "wo-" is left; can't ← the same idea, and its t is lost too;
    //   wouldn't ← the "-n't" is kept and the vowel heard as "would"
    { id: 's1', skill: 'sound', level: 'B2', point: 'smash', seg: [37.2, 40.25],
      stem: 'Fill the gap: “Okay, smashing your phone ___ stop hacking.”',
      choices: ['won’t', 'will', 'can’t', 'wouldn’t'], a: 0,
      cue: 'phone のすぐあと、短い一語。',
      line: 'Okay, smashing your phone *won’t* stop hacking.',
      said: '「電話を壊しても、ハッキングは止まらないよ」となだめる。',
      mean: 'won’t は「ウォウン」。最後の t はほぼ聞こえず、want に似た音になる。',
      trap: 'n’t が弱いと will に聞こえやすい。will なら意味が逆になるので、場面と合わせて判断する。',
      use: 'Yelling won’t fix it.（どなっても直らないよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'police', seg: [44.9, 47.3],
      stem: 'Type what she says: “to see ___ I was hacked” (3 words)', answer: 'whether or not',
      cue: '「investigation」のあと、to see に続く部分。',
      line: 'an investigation to see *whether or not* I was hacked',
      said: '「警察は、ハッキングされたかどうか調べるって」と説明する。',
      mean: 'whether or not ＝ 〜かどうか。3語がつながり「ウェザローナッ」のように聞こえる。',
      trap: 'weather と同じ音で、天気と混ざりやすい。or は弱く、ほぼ「ア」。',
      use: 'I can’t tell whether or not he’s joking.（冗談かどうか分からない）' },

    // why: an hour ← "an hour ago" comes later (the fake email); two days ← "two" is caught and the unit is lost
    // R fix: S4 (the start cut "undershirts" and the end cut "so I"): seg now 56.2–61.6
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', seg: [56.2, 61.6], keep: true,
      stem: 'When is Leslie’s press conference?',
      choices: ['In an hour', 'In two hours', 'In two days'], a: 1,
      cue: '「Pawnee Commons」のすぐあと。',
      line: 'a press conference about the Pawnee Commons *in two hours*',
      said: '「2時間後に、コモンズの記者会見がある」と言う。',
      mean: 'in two hours ＝ 今から2時間後。「2時間以内」ではなく、その時点を指す。',
      trap: 'two だけ聞いて単位を落としやすい。hours まで聞いて、時間か日かを確かめる。',
      use: 'The bus leaves in two hours.（バスは2時間後に出る）' },

    // R fix: V2 (blind 85 %; "can" and "could" made no sense): "could" → "couldn't", a real same-meaning near sound;
    //   S4 (the start cut "me", the end cut "say"): seg now 63.5–66.7
    // why: can ← the t of "can't" drops; couldn't ← the same meaning, and a weak couldn't loses its d
    { id: 's2', skill: 'sound', level: 'B2', point: 'typewriter', seg: [63.5, 66.7],
      stem: 'Fill the gap: “You ___ hack into a typewriter.”',
      choices: ['can', 'can’t', 'couldn’t'], a: 1,
      cue: '文頭 You のすぐあと、母音の長さ。',
      line: 'You *can’t* hack into a typewriter.',
      said: 'メール騒ぎの中で「タイプライターはハッキングできない」と言う。',
      mean: 'can’t は「キャーン」と母音が長く強い。肯定の can は弱く短く「クン」に近い。',
      trap: 't が消えると can に聞こえる。couldn’t は2音節。長い1音節は can’t。',
      use: 'You can’t park here after six.（6時以降ここには停められない）' },

    // R fix: V2 (blind 70 %; the key was the only choice about his own way): choices now about what the remark does;
    //   S4 (the start cut "me", the end cut "Can it"): seg now 63.5–66.75
    // why: offering ← "type" heard as an offer to help; warning ← the t of "can't" is lost, so it sounds like "you
    //   can hack into a typewriter"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'typewriter', seg: [63.5, 66.75],
      stem: 'In the remark about a typewriter, what is the speaker doing?',
      choices: ['Making a smug point and leaving it there', 'Offering to type up her emails for her',
                'Warning that even typewriters get hacked'], a: 0,
      cue: '短い一言と、そのあとの締めの言葉。',
      line: 'You can’t hack into a typewriter. *That’s all I have to say.*',
      said: '「タイプライターはハッキングできない。言いたいのはそれだけ」と言う。',
      mean: '手伝う気はなく、自分の古いやり方が正しかったと言いたいだけ。締めの一言で得意顔。',
      trap: '助けの申し出に聞こえるが、手伝う言葉はない。締めの一言で話の目的が分かる。',
      use: 'I told you so. That’s all I’ll say.（だから言ったでしょ。それだけ）' },

    // why: go ahead ← "can" heard as permission (you can do it); put it away ← "it" taken as the typewriter
    // R fix: S4 (the start cut "me"): seg starts 63.5
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'canit', seg: [63.5, 68.9],
      stem: 'In the reply to the typewriter remark, what is he told?',
      choices: ['Stop talking; this is no time for it', 'Go ahead; you can do it your way',
                'Put that away; this is no time for it'], a: 0,
      cue: '返事の最初の2語。',
      line: '*Can it*, Unabomber. This is an emergency.',
      said: '相手を変なあだ名で呼び、「黙って。今は緊急事態なの」と返す。',
      mean: 'Can it ＝ 黙って、やめて。くだけた強い言い方で、いらだったときに使う。',
      trap: 'can を「できる」、it を手元の物と取りやすい。命令の形で文頭に来たら、決まり文句を疑う。',
      use: 'Can it, I’m trying to sleep.（静かにして、寝たいの）' },

    // why: not at all ← "I'm not embarrassed by that" is said just before, about another email; amused ← the letters
    //   are silly and the room laughs
    // R fix: S4 (the start cut "Buckland", the end cut "There's"): seg now 89.3–93.75
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'embarrassed', seg: [89.3, 93.75],
      stem: 'How does Leslie feel about the fantasy pen-pal letters being found?',
      choices: ['A little embarrassed by them', 'Not at all embarrassed by them', 'Quite amused by them'], a: 0,
      cue: '直前の「恥ずかしくない」との違い。',
      line: '*I am a little embarrassed* by that.',
      said: '前のメールは「恥ずかしくない」、この空想の文通は「ちょっと恥ずかしい」と言う。',
      mean: '直前の not と対になる。恥ずかしがる所のずれが笑いどころ。',
      trap: 'embarrassed が2回出るので、前の not と混ざりやすい。2回目に not はない。',
      use: 'I’m a little embarrassed to say this.（ちょっと言いにくいんだけど）' },

    // R fix: V2 (blind 70 %; "excited about the parking plan" was a filler): a distractor is now "bored", from “I keep
    //   getting emails” heard alone; S4 (the start cut "welcome"): seg starts 98.1
    // why: glad ← "Oh, great" read at face value; bored ← "I keep getting emails all the time" heard without "I have to
    //   do well"
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'great', seg: [98.1, 104.9],
      stem: 'When one more email arrives, how does Leslie feel?',
      choices: ['Overwhelmed, with the big event coming', 'Glad the parking news has finally come',
                'Bored by yet another parking email'], a: 0,
      cue: '「Oh」のあとに続く2つの文。',
      line: '*Oh, great.* I got a new email… *I keep getting emails all the time.*',
      said: '「あーあ、また駐車場のメール。ひっきりなしに来る。会見は失敗できない」と言う。',
      mean: 'Oh, great はここでは「最悪」に近い皮肉。あとの文が、うんざりと焦りを示す。',
      trap: 'great を「よかった」、不満を退屈と取りやすい。最後の一文で焦りと分かる。',
      use: 'Oh, great. Another delay.（あーあ、また遅れか）' },

    // why: she hacked ← "hack into my email" with the subject missed; computers ← "boyfriends" + "hack" put together
    //   as a skill one of them has
    // R fix: S4 (the start cut "conference"): seg starts 104.95
    { id: 'd3', skill: 'detail', level: 'B1', point: 'boyfriends', seg: [104.95, 113.3],
      stem: 'Why does Donna know about email hacking?',
      choices: ['Her boyfriends have all tried it on her', 'She has hacked a boyfriend’s email herself',
                'One of her boyfriends works in computers'], a: 0,
      cue: '「Listen」のあと、彼女自身の経験。',
      line: '*Every single one of my boyfriends* has tried to hack into my email.',
      said: '名前を呼ばれ、「歴代の彼氏は一人残らず、私のメールに侵入しようとした」と言う。',
      mean: '狙われる側として慣れている、という話。だから対策を思いつく。',
      trap: '主語を落とすと、彼女がした側に聞こえる。has tried の主語は boyfriends。',
      use: 'Every single one of them said no.（一人残らず断った）' },

    // R fix: V2 (blind 85 %; only the key named an email, and "fake" matched the title's "trick"): all three choices
    //   are now things from Leslie's email
    // why: letters ← the pen-pal letters were found in her email earlier, so they sound like the bait; parking ← the
    //   parking email arrives just before Donna's idea
    { id: 'g2', skill: 'gist', level: 'B2', point: 'trap', seg: [114.2, 186.0],
      stem: 'How is Kim finally caught at the press conference?',
      choices: ['She asks about a made-up story planted in an email',
                'She quotes the private letters found in Leslie’s email',
                'She repeats the parking lot news from Leslie’s email'], a: 0,
      cue: '記者が会見で何について質問するか。',
      said: '偽のメールにだけ書いた土の話を、記者が会見で質問し、メールを読んでいたことがばれる。',
      mean: 'わざと偽の情報をメールに入れ、それを口にした人が読んだ人、というわな。',
      trap: '前に出た手紙や駐車場のメールと混ざりやすい。記者が聞くのは土の話。',
      use: 'That was a test, and you failed.（あれはテスト。引っかかったね）' },

    // R fix: V2 (blind 60 %; "the dull name of a report" was a filler): a distractor is now "minimal" read as modest
    //   wording; S4 (the start cut "dirt", the end cut "so"): seg now 122.55–130.9
    // why: failed ← "minimal" heard as "not enough"; top marks ← "minimal" read as modest wording (謙遜), as if the
    //   result were great
    { id: 'h4', skill: 'humor', level: 'C1', point: 'standards', seg: [122.55, 130.9],
      stem: 'Why does Leslie’s quote from the EPA get a laugh?',
      choices: ['She proudly quotes a verdict meaning “barely passed”',
                'She proudly quotes a verdict saying the soil failed',
                'She modestly quotes a verdict that meant top marks'], a: 0,
      cue: '「and I quote」のあとの3語。',
      line: 'we achieved, and I quote, *“minimal acceptable standards.”*',
      said: '「EPA によると『最低限の許容基準』を達成」と誇らしげに伝える。',
      mean: 'ぎりぎり合格という評価を、すごい成果のように引用するずれが笑い。',
      trap: 'minimal を「不合格」や控えめな言い方と取りやすい。acceptable ＝ 許容できる、ぎりぎり合格。',
      use: 'It’s not perfect, but it’s acceptable.（完璧じゃないけど、許容範囲）' },

    // R fix: V2 (blind 50 %; 18 was the only realistic middle): a fourth choice, "18 weeks", keeps the number and
    //   swaps the unit; S4 (the start cut "shabby"): seg starts 133.2
    // why: eight ← the -teen is swallowed; eighty ← -teen/-ty, and "much longer" pulls toward a big number; 18 weeks ←
    //   "eighteen" caught, the unit not
    { id: 'n2', skill: 'number', level: 'B1', point: 'months', seg: [133.2, 139.6], keep: true,
      stem: 'How long has Leslie said construction will take?',
      choices: ['18 weeks', '8 months', '18 months', '80 months'], a: 2,
      cue: '「construction will take」のあと。',
      line: 'You’ve claimed construction will take *18 months*',
      said: '記者が「工事は18か月とのことですが、もっと長いと聞きました」と迫る。',
      mean: 'eighteen は -teen を強く長く、eighty は前を強く言う。',
      trap: 'much longer が続くので大きい数に引かれやすい。強勢の位置で分ける。',
      use: 'It takes about eighteen minutes.（18分くらいかかる）' },

    // R fix: V2 (blind 70 %; "How sure" pointed at the key, "angry" was a filler): stem neutral; a distractor is now
    //   "would deny" read as formal politeness; S4 (the start cut "months"): seg starts 137.35
    // why: firm ← "deny" taken at face value, a flat no; formal ← "I would deny" read as polite official wording, like
    //   〜と存じます
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'deny', seg: [137.35, 142.0],
      stem: 'How does Leslie come across when she answers the source’s claim?',
      choices: ['Shaken; she stalls before a weak denial', 'Firm; she flatly says the report is false',
                'Formal; she gives a careful official no'], a: 0,
      cue: '同じ語の繰り返しと、助動詞の形。',
      line: '*I would… I would* deny that report.',
      said: '「わ、私は…その報道を否定…するでしょうね」と言いよどむ。',
      mean: 'I deny でなく仮定の would deny にし、しかも言い直す。はっきり否定できていない。',
      trap: 'deny だけなら否定。would を丁寧さと取りやすいが、言い直しは不安の表れ。',
      use: 'I would say… probably not.（まあ…たぶん違うかな）' },

    // why: too loudly ← "gasp" is caught but "would" (= they didn't) is missed; a guess ← she breaks her own moment,
    //   so it sounds like taking the charge back
    // R fix: V2 (blind 55 %; "got no reaction" spelled out the gap): key reworded; S4 (the start cut "to me", the
    //   end cut "That"): seg now 150.4–161.5, with the whole accusation
    { id: 'h5', skill: 'humor', level: 'C1', point: 'gasp', seg: [150.4, 161.5],
      stem: 'After her big accusation, why does Leslie’s next comment get a laugh?',
      choices: ['She notes her big moment fell flat', 'She teases the crowd for gasping so loudly',
                'She hints the charge was only a guess'], a: 0,
      cue: '「thought」と「would」の組み合わせ。',
      line: '*I really thought you guys would gasp* there.',
      said: '告発のあと「ここでみんな息をのむと思ったのに」と言う。',
      mean: 'thought … would ＝ そう思ったのに、ならなかった。空振りを自分で言う。',
      trap: 'gasp だけだと、実際に驚いたように聞こえる。thought と would は期待はずれ。',
      use: 'I really thought you’d laugh at that.（そこ、笑うと思ったのに）' },

    // R fix: V2 (blind 60 %; the fans choice was weak): a distractor is now Leslie, whose charge Kim is rebutting;
    //   S4 (the start cut "knights", the end cut "The point is"): seg now 168.75–176.95
    // why: husband ← "according to my husband" makes him sound like the one mocked; Leslie ← Kim calls the charge
    //   "baseless" and lectures her, so Leslie looks put down
    // anchor: 172.3–176.0 s "which, side note, was a terrible movie… according to my husband": mid-defence, she flags
    //   her own aside as off the point, and the opinion isn't even hers
    // retired: for the draws, with nt1 (one C2 alone is under 2)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'sidenote', seg: [168.75, 176.95], retired: true,
      stem: 'In Kim’s defence about Star Wars, who is the joke on?',
      choices: ['Kim, who rambles off the point while accused', 'Leslie, whose big accusation Kim brushes aside',
                'Her husband, a fan she quietly makes fun of'], a: 0,
      cue: '話の途中の寄り道と、最後に付けた出どころ。',
      line: 'which, *side note*, was a terrible movie… *according to my husband*…',
      said: '告発された最中に、映画をけなす話を「夫によれば」と付け足し、話を戻す。',
      mean: '潔白を示すべき場面で、関係ない映画評を人の受け売りで話す。笑われているのはキム本人。',
      trap: 'baseless と言い返すのでレスリーが、夫の話が出るので夫が笑われていると取りやすい。誰の欠点が見えるかで判断する。',
      use: 'Side note: the coffee here is great.（余談だけど、ここのコーヒーおいしい）' },

    // R fix: S1 (the stem said "how good the movie was"; she calls it terrible): stem neutral; V2 (blind 75 %; "main
    //   reason she is innocent" was weak): a distractor is now showing off her film knowledge; S4 (the start cut
    //   "one", the end cut "The point is"): seg now 171.2–176.95
    // why: knows the film ← she has just explained midichlorians in detail; husband ← "according to my husband"
    //   sounds like citing evidence
    { id: 'm1', skill: 'marker', level: 'B2', point: 'sidenote', seg: [171.2, 176.95],
      stem: 'When Kim gives her opinion of the movie, what is she doing?',
      choices: ['Flagging a remark as off her main point', 'Showing off how well she knows the film',
                'Citing her husband to back up her claim'], a: 0,
      cue: '映画の題名のあと、短く差しはさむ2語。',
      line: 'which, *side note*, was a terrible movie',
      said: '「ちなみに、ひどい映画だった。夫によればね」と付け足す。',
      mean: 'side note ＝ 余談だけど。本筋から外れる一言の前に置く、話のつなぎ。',
      trap: '詳しさを見せている、夫を根拠にしていると取りやすいが、自分で「余談」と前置きしている。',
      use: 'Quick side note before we start.（始める前にちょっと余談）' },

    // R fix: S4 (24.6 s, over the 15 s limit): seg now 176.95–186.0, the reveal only; V2 (blind 75 %; "made the
    //   story up" was weak): all three choices now name a source (near misses: the stolen speech, the EPA itself)
    // why: speech ← the stolen speech opens the clip, so it sounds like her source; EPA report ← Kim herself said
    //   "the EPA found…", and the email was "about the EPA"
    // anchor: 177.6–183.0 s "I sent Councilwoman Knope the fake email about the EPA finding midichlorians an hour ago":
    //   the substance Kim asked about at 142–148 s ("How serious is that, exactly?") existed only in that email
    // retired: for the draws (play 3+ drew no C2 while one was unseen: g2, the gist, shares its point)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'trap', seg: [176.95, 186.0], retired: true,
      stem: 'Why doesn’t Kim’s expert answer about midichlorians help her?',
      choices: ['Only a fake email to Leslie had mentioned them', 'Only Leslie’s stolen speech had mentioned them',
                'Only the new EPA report had mentioned them'], a: 0,
      cue: '反論のあとの、誰が何をいつ送ったかの説明。',
      line: 'I sent Councilwoman Knope *the fake email* about the EPA finding midichlorians *an hour ago*',
      said: '記者は「架空の物質だ」と詳しく反論するが、「その話の偽メールを1時間前に送った」と明かされる。',
      mean: '記者が質問した物質は、偽メールにしか出てこない。読んだことがはっきりする。',
      trap: 'EPA や原稿が出どころと取りやすい。about the EPA は偽メールの中身。問題はどこで知ったか。',
      use: 'Where did you hear that, exactly?（それ、どこで聞いたの？）' },
  ]
};
