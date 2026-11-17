// “You Are Toxic - The Office US” (the official The Office channel, BEST OF The Office - Season 8): Ryan confronts Pam
// for warning Kelly about him, gets told to his face that she doesn't like him, then tries to win Kelly back from Ravi
// in front of coworkers who all side with Ravi; his proposal ends with Kelly choosing Ravi.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Pam (12.6 s), Ryan (30.8, 56.5,
// 76.8 s), Kelly (3.8 s and on), Ravi; "Brian" (46.6 s, both sources) is a coworker misnaming Ryan. The coworkers who
// side with Ravi are never named, so stems call them "a coworker" and never ask who. Untested: 0–1.5 s ("You have to
// be kidding me", whisper only), 107–116 s (boos and "You are toxic" over each other), 138–153 s ("turn this around":
// what is being turned isn't said; "She don't want to turn around"), 182–205 s ("No, you don't" turns, and the sources
// disagree: "I have a huge…" vs "Can I have a hug?", "maturing" vs "sharing it").
// EAR CHECK: 71.4–72.6 s s1 — "it would cause me" (both sources); the item claims "cause" ends in a z sound, unlike "cost"
// EAR CHECK: 119.7–120.6 s x1 — "wasn't going to" (both sources); the item claims the t of n't nearly drops
//   (if it's really "wasn't gonna", the answer has to change)
// EAR CHECK: 13.4–14.4 s f1 — "say it to my face" (captions) vs "say it in my face" (whisper); the line says "to"
// REVIEW 2026-11-16: pass 2, fix 21, drop 1 (c3), new 0; ear checks 3
// OPEN: "Oh, no, no, no, read it, please. I love amazing poetry" (67.4 s) and "Read through the pain, be strong" were
//   given to Kelly; nothing in the audio says who speaks, and they sound like a coworker mocking Ryan. No item turns on
//   it now. Also check the setting: stems call the others "coworkers", but Kelly says "my friends" and one of them has
//   known Ryan only "a short while".
// OPEN: g2 is still about 50 % blind (the title "You Are Toxic" frames the crowd against Ryan), and h4 about 45 %.
import type { Clip } from '../types.ts';

export const ryankelly: Clip = {
  id: 'ryankelly', video: 'AHMpAVf8wps', title: 'You Are Toxic', dur: 226, wpm: 150, band: 'mid',
  tags: ['職場', '恋愛'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %): "still wants her back" was a filler, and "was going to" didn't fit what a reminder is.
    //   Now a tense near miss and the keyword trap from Ryan's "bad-mouthing". S4: the segment ended inside "that's"
    //   (7.84 s); now 8.35 s, before "opinion".
    // why: still treats ← "used to" is weak and fast, so only "treat her badly" is caught; bad-mouthing ← Ryan's word
    //   in the line just before, in the wrong relation
    { id: 'd1', skill: 'detail', level: 'B1', point: 'badly', seg: [1.5, 8.35],
      stem: 'What does Pam say she told Kelly about Ryan?',
      choices: ['That he used to treat her badly', 'That he still treats her badly', 'That he’s been bad-mouthing her'], a: 0,
      cue: '「All I did was」のあと。',
      line: 'All I did was *remind her that you used to treat her badly*.',
      said: '「あなたが前は彼女にひどい扱いをしていたって、思い出させただけ」。',
      mean: 'used to ＝ 以前は〜していた。remind は、もう知っていることを思い出させること。',
      trap: 'used to は弱く速い。今か昔かは、動詞の前の短い音で決まる。',
      use: 'I used to live near here.（前はこの近くに住んでいた）' },

    // R fix: V2 (blind 60 %): the key was the only choice that described a joke. All three now explain the same
    //   three "opinion"s, each a reading a listener could take.
    // why: put it in her head ← "your opinion, and it's her opinion" heard as Pam feeding Kelly the idea (wrong
    //   implication); mixed up ← "opinion" three times in a row sounds like a muddle
    { id: 'h1', skill: 'humor', level: 'C1', point: 'opinion', seg: [7.2, 11.1],
      stem: 'What makes Ryan’s reply about opinions funny?',
      choices: ['Two people agree against him, and he brushes it off', 'He means Pam put her opinion into Kelly’s head',
                'He confuses whose opinion is whose and trips up'], a: 0,
      cue: 'opinion を3回言う、その持ち主。',
      line: 'that’s *your opinion*, and it’s *her opinion*, but it’s *not my opinion*.',
      said: '「それは君の意見で、彼女の意見でもある。でも僕の意見じゃない」と言う。',
      mean: '二人が同じ意見なのに、自分は違うから関係ない、という理屈。不利な数を自分で数えている。',
      trap: 'opinion が続くので混乱して聞こえる。持ち主を順に聞く。',
      use: 'That’s just your opinion.（それはあなたの意見でしょ）' },

    // R fix: V2 (blind 85 %): two fillers. Now two near misses on where or how to say it. V5: a common idiom is B2
    //   (d2 goes to B1, so the shares hold). S4: the segment began inside "not my" (10.45 s); now 10.2 s. N1: whisper
    //   has "in my face", so it's on the EAR CHECK list.
    // why: in front of everyone ← there's a crowd, and "to my face" heard as "in public"; straight face ← the
    //   idiom "say it with a straight face" mixed in through "face"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'face', seg: [10.2, 14.9], retired: true,
      stem: 'What does Ryan ask Pam to do if she has something bad to say?',
      choices: ['Say it to him directly, in person', 'Say it in front of everyone here', 'Say it seriously, with a straight face'], a: 0,
      cue: '「Pam」と呼んだあと、say it に続く部分。',
      line: 'If you have something bad to say to me, Pam, *say it to my face*.',
      said: '「僕に悪口があるなら、面と向かって言え」と言う。',
      mean: 'say it to my face ＝ 陰で言わず、本人に直接言え。挑発としてよく使う。',
      trap: 'face から「顔・表情」の言い方を思いやすい。to my face は場所でなく「本人に直接」。',
      use: 'He’d never say that to my face.（あの人、面と向かってはそう言わないよ）' },

    // R fix: V2 (blind 60 %): the key was the only two-part choice, and "dare" echoed the stem's "challenge". All three
    //   now start "Agreeing", and the stem no longer says "challenge". N7: mean said she says it "directly", f1's key.
    // why: apologizing ← "fair enough" read as a concession (おっしゃる通り), so an apology seems next; walking away ←
    //   a short reply and a pause read as closing the talk
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'fair', reveals: ['dislike'], seg: [14.5, 21.5],
      stem: 'When Pam answers Ryan, what is she doing?',
      choices: ['Agreeing to it, and then doing exactly that', 'Agreeing with him, and then apologizing',
                'Agreeing with him, and then walking away'], a: 0,
      cue: '短い返事のあと、少し間をおいて続く言葉。',
      line: '*Fair enough.* Um… I don’t think you’re a very good person.',
      said: '「確かに」と受けて、間をおき「あなたはいい人じゃないと思う」と面と向かって言う。',
      mean: 'fair enough ＝「それはもっとも」。相手の出した条件を受け入れ、そのとおりに実行する。',
      trap: '謝る前置きと取りやすい。返事のあとに何をするかで判断する。',
      use: 'Fair enough. Let’s do it your way.（もっともだね。君のやり方でいこう）' },

    // R fix: V2 (blind 60 %): the key was the only two-sided choice. All three now pair a form with a content.
    //   S4: the segment ended inside "much" (25.6 s); now 25.9 s.
    // why: gentle ← "forgive me" and "I feel like" sound considerate; joking ← an old, familiar line ("said this
    //   before") heard as banter between friends
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'dislike', seg: [19.2, 25.9],
      stem: 'How does Pam put her view of Ryan to him?',
      choices: ['Polite in form, blunt in content', 'Polite in form, gentle in content',
                'Blunt in form, joking in content'], a: 0,
      cue: '「forgive me」の前後、言葉の丁寧さと中身。',
      line: 'I *don’t think you’re a very good person*. And *forgive me*, but… *I don’t like you very much*.',
      said: '「いい人じゃないと思う。前にも言った気がするけど、あまり好きじゃない」。',
      mean: 'forgive me で言い方は丁寧だが、中身ははっきりした「嫌い」。静かに言い切っている。',
      trap: '丁寧な言葉を気づかいと取りやすい。言い方より、最後に何を言ったかで判断。',
      use: 'Forgive me, but I disagree.（失礼ですが、反対です）' },

    // R fix: V2 (blind 70 %): Ryan is the speaker, so the one pro-Ryan choice was the key. All three now favour
    //   Ryan. V5: said explicitly in one clause, so B1 (f1 takes its B2). S4: the segment began inside "very much";
    //   now 25.85 s. S3: the cue had "match", which only the key has.
    // why: treat her better ← Pam's "treat her badly" just before, flipped; knows her better ← "for Kelly" heard
    //   without "match", a common boast in a love triangle
    { id: 'd2', skill: 'detail', level: 'B1', point: 'match', seg: [25.85, 29.9],
      stem: 'What does Ryan say a lot of people would say?',
      choices: ['He’s a better match for Kelly than Ravi', 'He’d treat Kelly better than Ravi would',
                'He knows Kelly better than Ravi does'], a: 0,
      cue: '「a lot of people would say」のあと、比べ方。',
      line: 'a lot of people would say that *I’m a better match for Kelly than Ravi is*.',
      said: '「僕の方が Ravi より Kelly にお似合いだって言う人は多い」と言う。',
      mean: 'match ＝ 相性のいい相手。比べる文は better の前の主語をつかむ。',
      trap: '何で比べているかを聞く。match の一語で「相性」の話と決まる。',
      use: 'You two are a great match.（二人はお似合いだね）' },

    // R fix: K2 + V2 (blind 70 %): the poem distractor is true in the audio (someone does say "read it, please" and
    //   "read through the pain", and no name says it's Kelly), and the key was the only hostile choice. Now a mocking
    //   cheer and a split. The trap no longer names a speaker. S4: start 25.9 s, not inside "a lot".
    // why: cheer him on ← "read through the pain, be strong" taken as sincere support (sincerity flip); split ← two
    //   names keep coming up, so it sounds like a debate
    { id: 'g2', skill: 'gist', level: 'B2', point: 'crowd', seg: [25.9, 90],
      stem: 'While Ryan argues his case, how do the coworkers respond?',
      choices: ['They back Ravi and tell Ryan to leave her alone', 'They laugh at Ryan but cheer him on to win her',
                'They are split, some for Ryan and some for Ravi'], a: 0,
      cue: 'Ryan が何か言うたび、まわりの返事。',
      line: 'Ravi’s *way better*. … Please *leave her alone*.',
      said: '「自分の方がお似合い」と言う Ryan に、同僚は「Ravi の方がずっといい」と返す。',
      mean: '味方は一人もいない。Ryan の「多くの人が言う」は、その場で否定される。',
      trap: 'がんばれ風の言葉はからかい。最後の leave her alone で決まる。',
      use: 'Come on, really?（ちょっと、本気で言ってる？）' },

    // R fix: V2 (blind 75 %): the key was the only praise. "Come as a set" (package = 一まとめ) replaces the gift
    //   reading, which nobody would take about a person in this scene.
    // why: a set ← package = 一まとめ, セット; looks only ← "whole" missed, so "package" heard as an outward wrapping
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'package', seg: [36.3, 40.6],
      stem: 'When a coworker sums up Ravi, what does he mean?',
      choices: ['Ravi has every quality you could want', 'Ravi and Kelly come as a set now',
                'Ravi is good-looking but nothing more'], a: 0,
      cue: '「insane right now」のあと、Ravi を表す一言。',
      line: 'Ravi’s *the whole package*.',
      said: '「Ravi は全部そろってる」とほめる。',
      mean: 'the whole package ＝ 見た目も性格も中身も全部そろった人。人をほめる決まった言い方。',
      trap: 'package を「セット・一まとめ」と取ると二人組の話に。人一人に使うと「全部入り」。',
      use: 'Smart, kind, funny. He’s the whole package.（頭よし、優しい、面白い。完璧だね）' },

    // R fix: S1/C5: the stem said "vote for Ravi", which is g2's fact. It now names the moment only.
    // why: Brian ← the name is said, so it seems a third person is involved; met once ← "personally" heard as "I
    //   personally like him", as if they'd met
    { id: 'h3', skill: 'humor', level: 'C1', point: 'nevermet', seg: [40.4, 51.65],
      stem: 'What makes this coworker’s comment funny?',
      choices: ['He prefers a man he has never met over Ryan', 'He mixes up Ravi with a friend called Brian',
                'He met Ravi once and liked him right away'], a: 0,
      cue: '「personally」と「again」、二度言う同じこと。',
      line: 'I’ve *never met Ravi* personally… I prefer Ravi. And again, I’ve *never even met the guy*.',
      said: '「Ravi には会ったことない。でも君を少し知って、Ravi がいい」と言う。',
      mean: '会ったこともない人の方がまし、は最大級の否定。それを二度念押しする。',
      trap: 'personally を「個人的に好き」と取ると、会った話に。never met を二度聞く。',
      use: 'I’ve never met him, but I like him already.（会ったことないけど、もう好き）' },

    // anchor: 44.5–48.6 s "just having knowing… a short while, Brian, that I prefer Ravi" (both sources: "Brian");
    //   the man he answers is Ryan, named at 30.8, 56.5 and 76.8 s, and no Brian ever speaks
    // R fix: K2 + V2 (blind 50 %): the stem said he was calling Ryan, which refuted "someone else named Brian" before
    //   the audio, and the key repeated h3's "still prefers Ravi". Now three "It shows…" readings of the name; the
    //   new near miss is the Ryan/Ravi/Brian sound tangle.
    // why: tease ← the sincerity flip: a different name heard as friendly (あだ名); Ravi ← Ryan, Ravi and Brian sound
    //   alike, so the man seems to mix up the two rivals
    { id: 'c1', skill: 'infer', level: 'C2', point: 'nevermet', seg: [40.4, 51.65],
      stem: 'When the coworker calls Ryan “Brian”, what does that add to his point?',
      choices: ['It shows how little he knows the man he judges', 'It shows he likes Ryan enough to tease him',
                'It shows he is mixing Ryan up with Ravi'], a: 0,
      cue: '「a short while」の直後の呼びかけ。',
      line: '…*a short while, Brian*, that I prefer Ravi',
      said: '「知り合って少しだけど、ブライアン、Ravi の方がいい」と、Ryan を別の名前で呼ぶ。',
      mean: '名前さえ覚えていないことが「少し知っただけ」の短さを示す。本人は気づかず、自分の言葉を証明している。',
      trap: 'あだ名や Ravi との取り違えと取りやすい。Ravi は同じ文で正しく呼んでいる。',
      use: 'Thanks, uh… Mike? — It’s Mark.（ありがとう、えーと…マイク？　マークだよ）' },

    // R fix: S4: the segment began inside "Nobody" and left out the line the stem names; now 53.2 s, before
    //   "Nobody believes in us".
    // why: touched ← "nobody believes in us" is a romantic line, so a romantic answer is expected; worried ←
    //   "my friends" heard as her doubting Ravi because of them
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'scene', seg: [53.2, 59.3],
      stem: 'How does Kelly feel when Ryan says nobody believes in them?',
      choices: ['Embarrassed, and wants him to stop', 'Touched that he would fight for her',
                'Worried that her friends are right'], a: 0,
      cue: '「Ryan」と呼んだあとの頼み。',
      line: 'Ryan, just *stop making a scene* in front of all my friends.',
      said: '「Ryan、友だちの前で騒ぎを起こさないで」と止める。',
      mean: 'make a scene ＝ 人前で騒ぐ。みんなの前で恥ずかしい、という気持ち。',
      trap: 'scene を「場面・ドラマ」と取ると感動の場面に聞こえる。make a scene は人前の迷惑な騒ぎ。',
      use: 'Please don’t make a scene here.（ここで騒がないでね）' },

    // R fix: V2 (blind 55 %) + N4: "Kelly said she doesn't like poetry" was a filler, and its note gave "I love
    //   amazing poetry" to Kelly, which no name in the audio settles. Now "the others would mock it", a reading the
    //   crowd's teasing invites. S4: the segment ended inside "My God" (76.56 s); now 76.5 s.
    // why: shy ← the Japanese frame: not reading in front of people heard as 照れ; mock ← "I love amazing poetry"
    //   and "read through the pain" are teasing, so fear of ridicule seems the reason
    { id: 'i1', skill: 'infer', level: 'C1', point: 'poem', seg: [63.2, 76.5],
      stem: 'Why does Ryan keep refusing to read the poem?',
      choices: ['To make the poem seem too powerful to share', 'Because he’s too shy to read it to a crowd',
                'Because he knows the others would mock it'], a: 0,
      cue: '断る理由として何を言うか、3回分。',
      line: 'My heart couldn’t handle it. … This poem *would crush you*.',
      said: '「心がもたない」「つらすぎる」「この詩は君を打ちのめす」と、読まずに理由だけ並べる。',
      mean: '読まないことで、詩をすごいものに見せている。見せない分だけ大げさになる。',
      trap: '照れや、からかわれる心配と取りやすい。本人が挙げる理由は、痛みと詩の威力だけ。',
      use: 'Trust me, it’s too good to show you.（信じて、すごすぎて見せられない）' },

    // R fix: S4: the segment began inside "read it" (68.8 s); now 69.0 s.
    // why: could ← w/k at the start of a weak word; cost ← cost/cause differ only in the vowel and the last sound
    { id: 's1', skill: 'sound', level: 'B2', point: 'pain', seg: [69.0, 73.15],
      stem: 'Fill the gap: “No, ___ too much pain.”',
      choices: ['it would cause me', 'it could cause me', 'it would cost me'], a: 0,
      cue: '「No,」のあと、動詞の終わりの音。',
      line: 'No, *it would cause me* too much pain.',
      said: '「だめだ、つらすぎる」と読むのを断る。',
      mean: 'it would は弱く「イッウッ」と短い。cause は「コーズ」と濁る音で終わる。',
      trap: 'cost は s と t の澄んだ音で終わる。would と could は最初の音で分ける。',
      use: 'It would cause too much trouble.（面倒なことになりすぎる）' },

    // R fix: S4: the segment began inside "alone" (83.36 s); now 83.85 s.
    // why: childish ← cookie = 甘い・子どもっぽい; strict ← cutter heard as sharp, harsh
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'cookie', seg: [83.85, 90],
      stem: 'What kind of world does Ryan say the others live in?',
      choices: ['One where everyone is the same', 'One that is sweet but childish', 'One with strict and harsh rules'], a: 0,
      cue: '「screws up their」のあとの言葉。',
      line: 'our love scares them. It screws up their *cookie-cutter world*.',
      said: '「僕らの愛がみんなを怖がらせる。型にはまった世界を乱すから」。',
      mean: 'cookie-cutter ＝ クッキーの型抜き。同じ形ばかりで、個性のないもの。',
      trap: 'cookie から「甘い」、cutter から「厳しい」を思いやすい。型抜きで同じ形が並ぶ絵。',
      use: 'I hate cookie-cutter hotels.（どこも同じようなホテルは嫌い）' },

    // anchor: 95.5–103.6 s "Do you guys think he's right, though? Do we live in a cookie-cutter world?" — "Absolutely,
    //   but it's not the point." "Absolutely" grants the insult; "but it's not the point" keeps the verdict (the group
    //   has just told Ryan to leave her alone, 76.8–84 s)
    // why: he's right ← "Absolutely" heard as full agreement with Ryan (scope shift); no ← "not the point" heard as
    //   denying the insult (direction flip)
    { id: 'c2', skill: 'infer', level: 'C2', point: 'cookie', seg: [95, 104.2],
      stem: 'Which plain-English version keeps the answer to “Do we live in a cookie-cutter world?”',
      choices: ['“Sure, our lives are dull, but Ryan’s still wrong.”', '“Sure, he’s right, so Kelly should go with him.”',
                '“No, our lives are fine; that’s beside the point.”'], a: 0,
      cue: '短い一語の返事と、そのあとの一言。',
      line: 'Do we live in a cookie-cutter world? — *Absolutely, but* it’s not the point.',
      said: '「僕らって型にはまってる？」に「完全にね。でもそれは関係ない」と返す。',
      mean: '悪口は認めても結論は変えない。absolutely で認め、but で「だから Ryan が正しいわけではない」と線を引く。',
      trap: 'absolutely を全面的な賛成と取りやすい。but が認めた範囲を決める。',
      use: 'True, but that’s not the point.（確かに。でもそこじゃないんだよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'interrupt', seg: [118.5, 121.35],
      stem: 'Type what Kelly says: “I ___ interrupt.” (3 words)', answer: 'wasn\'t going to',
      cue: '「don’t interrupt」と言われた直後の返事。',
      line: 'I *wasn’t going to* interrupt.',
      said: '「割りこむつもりなんてなかった」と返す。',
      mean: 'was going to ＝ 〜するつもりだった。wasn’t の t はほぼ消え、going to と速くつながる。',
      trap: 't が消えると was に聞こえ、意味が逆になる。n の鼻音が残るかを聞く。',
      use: 'I wasn’t going to say anything.（何も言うつもりなかったよ）' },

    // R fix: V2 (blind 55 %): "sorry for many things" was weak. Now the literal hedge read as humble sincerity, the
    //   near miss a fluent listener takes. S4: the segment began inside "thank you"; now 122.75 s.
    // why: can't remember ← "whatever reason" heard as "I forget the reason"; truly sorry ← the hedge read as a humble
    //   "whatever the reason, I'm sorry" (the Japanese frame: 理由はともかく)
    { id: 'i2', skill: 'infer', level: 'C1', point: 'whatever', seg: [122.75, 129.3],
      stem: 'What does “for whatever reason” show about Ryan’s apology?',
      choices: ['He doesn’t think she deserved better', 'He is truly sorry, whatever the reason',
                'He can’t remember why they broke up'], a: 0,
      cue: '「the way that you」のあと、挟みこんだ言葉。',
      line: 'the way that you, *for whatever reason*, feel you deserve to be treated.',
      said: '「君が、なぜかふさわしいと思う扱いを、してこなかった」と謝る。',
      mean: 'for whatever reason ＝「理由は知らないが」。彼女の期待を分からないと言っている。',
      trap: '「理由はともかく、ごめん」と取りやすい。挟んだ語は彼女の気持ちにかかる。',
      use: 'For whatever reason, he likes me.（なぜだか、彼は私が好きらしい）' },

    // R fix: V2 (blind 65 %): the key was the only choice about the build-up. All three now start "His grand
    //   promise", so each reads as a joke.
    // why: tomorrow ← "maybe not tomorrow" leaves "tomorrow" ringing; formal ← "Kelly Kapoor" is said, and a full
    //   name can sound stiff
    { id: 'h4', skill: 'humor', level: 'C1', point: 'probably', seg: [129, 137],
      stem: 'What makes the end of Ryan’s marriage promise funny?',
      choices: ['His grand promise ends by doubting itself', 'His grand promise is for tomorrow, not today',
                'His grand promise sounds far too formal'], a: 0,
      cue: '「someday」のあと、付け足しの一語。',
      line: 'Maybe not today, maybe not tomorrow, but someday. *And probably.*',
      said: '「今日じゃなくても、明日じゃなくても、いつか。たぶんね」と言う。',
      mean: '盛り上げたプロポーズを、最後の「たぶん」で自分で弱めている。決めぜりふが崩れる落ち。',
      trap: 'tomorrow が耳に残ると近い日の約束に聞こえる。最後の付け足しで約束の強さが決まる。',
      use: 'I’ll call you tomorrow. Probably.（明日電話するよ。たぶん）' },

    // R drop: c3 (humor C2, "who is the joke on"): blind 65 %, and at heart: in a scene where everyone mocks Ryan,
    //   "Ryan" is the guess, and its mechanism (his promise undercuts itself) repeats h4. Never shipped; deleted.

    // R fix: V2 (blind 60 %): the key was the only two-part choice. Now three answers of one shape.
    // why: picks Ryan ← "You mean so much to me" heard as the answer, and "Will you roll those dice with me?" just
    //   before; both down ← "I hope we can still be friends" heard as a no to everyone
    { id: 'g1', skill: 'gist', level: 'B1', point: 'outcome', reveals: ['choose'], seg: [153, 186.5],
      stem: 'How does Ryan’s big speech to Kelly turn out?',
      choices: ['She picks Ravi but hopes they stay friends', 'She picks Ryan but asks to take it slowly',
                'She turns them both down for now'], a: 0,
      cue: '最後の Kelly の返事、but のあと。',
      line: 'But I *love Ravi, and I choose him*. … I hope we can still be friends.',
      said: 'Ryan の告白に、Kelly は「Ravi を選ぶ。友だちでいたい」と答える。',
      mean: '結婚の申しこみは、はっきり断られて終わる。',
      trap: '最初の温かい一言で yes に聞こえやすい。答えは but のあと、だれを選ぶかの一言。',
      use: 'I hope we can still be friends.（これからも友だちでいたいな）' },

    // R fix: S4: the segment began inside "on you" and ended inside "to you" (164.64 s); now 159.4–165.08 s.
    // why: poem ← the love poem came up earlier; promises ← he has just listed what he can't promise
    { id: 'd3', skill: 'detail', level: 'B1', point: 'article', seg: [159.4, 165.08],
      stem: 'What does Ryan offer to email Kelly?',
      choices: ['A very interesting article', 'The love poem he wrote her', 'A list of his promises'], a: 0,
      cue: '「Men aren’t built that way」の次の文。',
      line: 'There’s a very interesting *article I can email to you*.',
      said: '「とても面白い記事があるから、メールで送るよ」と言う。',
      mean: 'article ＝ 記事。結婚と浮気についての記事を、プロポーズの最中に勧めている。',
      trap: '前に出た love poem を思い出しやすい。email の前の名詞を聞き取る。',
      use: 'I’ll email you the link.（リンクをメールで送るね）' },

    // R fix: V2 + K3: 90 % was a filler, and there was no why. 55 % (the second "fifty" heard as "fifty-five")
    //   replaces it.
    // why: 15 % ← fifty/fifteen; 55 % ← "fifty-fifty" heard as one number, "fifty-five"
    { id: 'n1', skill: 'number', level: 'B2', point: 'odds', seg: [165.7, 170.2], keep: true,
      stem: 'What chance does Ryan give that they’ll break up within the week?',
      choices: ['15%', '50%', '55%'], a: 1,
      cue: '「the odds are」のすぐあと。',
      line: 'even if *the odds are 50/50* that we’ll break up within the week',
      said: '「1週間以内に別れる確率が五分五分だとしても」と言う。',
      mean: 'fifty-fifty ＝ 五分五分、半々。the odds are ～ で「見込みは～」。',
      trap: 'fifteen や fifty-five と取りやすい。同じ数を2回言えば五分五分。',
      use: 'It’s fifty-fifty whether it rains.（雨になるかは五分五分）' },

    // R fix: V2 (blind 85 %): two fillers. Now two near misses built from “odds” and “roll”.
    // why: betting on her choice ← "odds" and dice heard as a bet that she'll pick him over Ravi; keep trying ← "roll"
    //   heard as roll again, a second try
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'dice', reveals: ['odds'], seg: [165.7, 172.6],
      stem: 'What does Ryan mean by the part about dice?',
      choices: ['He’ll take the risk with her anyway', 'He’s betting that she’ll choose him',
                'He’ll keep trying until it works'], a: 0,
      cue: '確率の話のあと、I want to に続く部分。',
      line: '…*I want to roll those dice*.',
      said: '「五分五分でも、そのさいころを振りたい」と言う。',
      mean: 'roll the dice ＝ 運にかけてやってみる。結果が分からなくても挑戦する決意。',
      trap: 'dice から「彼女を賭けた勝負」を思いやすい。直前の確率は別れる見込みの話。',
      use: 'Let’s just roll the dice and apply.（ダメもとで応募してみよう）' },

    // R fix: V2 (blind 70 %): the key was the only choice about what comes next. All three are now short moves.
    // why: can't decide ← the Japanese frame: a warm line before the answer heard as hesitation (迷い); yes ←
    //   "mean so much" heard as love
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'choose', seg: [176.4, 186],
      stem: 'When Kelly finally answers, what does her first sentence do?',
      choices: ['Softens the no that comes next', 'Sets up the yes that comes next', 'Shows she can’t decide yet'], a: 0,
      cue: '最初の一文と、そのあとの but。',
      line: '*You mean so much to me.* But I love Ravi, and I choose him.',
      said: '「あなたは大切な人。でも Ravi を愛していて、彼を選ぶ」と答える。',
      mean: '先に相手を大事に思う言葉を置いて、断りを和らげている。断り方の定番の形。',
      trap: '温かい一言で yes を期待しやすい。好意の言葉のあとの but に本題が来る。',
      use: 'You mean a lot to me, but no.（大切だけど、ごめん）' },
  ]
};
