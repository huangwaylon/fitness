// “Ben Can't Take It Any More | Parks and Recreation” (the official Parks and Recreation channel, Season 6): a racy
// new chard stand opens at Leslie's farmers market; she pushes Ben, now city manager, to kick it out, he proposes
// keeping work talk out of home, and she agrees, then corners him in the City Hall parking lot with a rule book.
// Segments from the captions, words from whisper (2026-11-16). Left out: 14–22 s (visual), 36–65 s (the stand's
// innuendo pitch), 90–100 s (garbled “till I check the rules”, then a visual gag), 115–128 s (innuendo and “half
// naked”), 150–159 s (film trivia), 170–176 s (“stripper show”) and whisper's looped “Bye” from 198 s. The cabbage
// seller's name differs (captions “Connie”, whisper “Pawnee”), so no stem names her; the reply at 47.5 s isn't
// named either. Captions spell the puns “Roma Cal” and “Bay Le P”: same sounds as whisper's “romaine calm”, “believe”.
// EAR CHECK: 50.4 s a1 — the reply “I suppose that's one way to sell vegetables” is taken as dry, not angry or warm
//   (the words carry it; no stem names the speaker)
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const chardStand: Clip = {
  id: 'chardstand', video: 'pAxQi8vB55s', title: 'Ben Can\'t Take It Any More', dur: 219, wpm: 159, band: 'mid',
  tags: ['職場', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 60 % right; "places to eat out" was a filler. A campaign-speech reading of "greatest achievements as
    //   city councilor" replaces it.
    // why: higher office ← "one of my greatest achievements as city councilor" heard as a campaign pitch; city help ←
    //   "city councilor" heard as her asking the city for money
    { id: 'g1', skill: 'gist', level: 'B1', point: 'market', seg: [2.0, 18.3],
      stem: 'What is Leslie’s opening talk to the camera mainly about?',
      choices: ['Why she’s proud of the market she started', 'Why she wants to run for a higher office', 'Why the market needs more help from the city'], a: 0,
      cue: '最初の一文と、続く「It’s good for…」の並び。',
      line: 'Opening this farmers market was one of my *greatest achievements*…',
      said: '「このファーマーズマーケットを開いたのは、議員としての大きな功績の一つ」と話す。',
      mean: '経済、家族、健康に良いと理由を並べ、自分の作った市場を誇っている。',
      trap: 'as city councilor から選挙の話にも聞こえる。最初の一文が柱。',
      use: 'It’s one of my proudest moments.（一番誇れることの一つ）' },

    // why: economy ← listed first, the first "good for"; families ← the second "good for"; only the last item takes
    //   "which Pawnee desperately needs"
    { id: 'd1', skill: 'detail', level: 'B2', point: 'needs', seg: [6.3, 14.1],
      stem: 'Which benefit of the market does Leslie say Pawnee desperately needs?',
      choices: ['A healthier way of living', 'A stronger local economy', 'More for families to do'], a: 0,
      cue: '「which」の直前に来る項目。',
      line: '…good for *promoting a healthy lifestyle*, which Pawnee desperately needs.',
      said: '経済、家族、健康的な生活に良いと並べ、「パーニーにはそれが切実に必要」と足す。',
      mean: 'which は直前の healthy lifestyle を指す。町の不健康さへの軽い皮肉。',
      trap: '三つ並ぶと最初の項目が残りやすい。which は直前の語にかかる。',
      use: 'I need sleep, which I rarely get.（睡眠が必要。めったに取れないけど）' },

    // R fix: V2, blind 60 % right; "sells out fast" was weak. A what's-in-season reading of "what's good today" replaces it.
    // why: in season ← "what's good today" heard as asking what's fresh now; cheapest ← the same question heard as asking
    //   about deals
    { id: 'ph1', skill: 'phrase', level: 'B1', point: 'safebet', seg: [24.55, 30.9],
      stem: 'What does the cabbage seller say about green cabbage?',
      choices: ['It’s a choice you can count on', 'It’s the best choice in season now', 'It’s the cheapest choice today'], a: 0,
      cue: '「Green cabbage is always」のあと。',
      line: 'Green cabbage is always *a safe bet*.',
      said: '「今日のおすすめは？」に「緑のキャベツならいつも安心」と答える。',
      mean: 'a safe bet ＝ まず外れない選び方。can’t go wrong も同じ。',
      trap: 'what’s good today から「旬」の話に聞こえる。safe bet は「無難」。',
      use: 'The pasta is always a safe bet.（パスタならまず外れない）' },

    // R fix: V2, blind 55 % right; the key was the only nuanced tone ("dry little joke"). The choices are now three
    //   stances on the stand, and the stem doesn't ask for a tone label; one is the Japanese まあいいか reading.
    // why: fine ← "I suppose" heard as まあいいか, mild acceptance; clever ← "one way to sell vegetables" taken as admiring
    //   a smart idea
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'oneway', seg: [44.9, 52.7],
      stem: 'When Leslie asks what is going on, what does the reply say about the stand?',
      choices: ['It goes too far, though it’s put mildly', 'It’s a clever idea, worth copying', 'It’s fine, and nothing to worry about'], a: 0,
      cue: '「I suppose」で始まる一文。',
      line: 'Oh yeah, that’s the new chard stand. *I suppose that’s one way to sell vegetables*.',
      said: '「ああ、新しい店だよ。まあ、そういう野菜の売り方もあるか」と返す。',
      mean: '「そういうやり方もあるか」と控えめに言い、「やりすぎ」と伝える。',
      trap: 'I suppose を「まあいいか」と取ると容認に聞こえる。one way は「やりすぎ」を控えめに言う形。',
      use: 'Well, that’s one way to do it.（まあ、そういうやり方もあるね）' },

    // R fix: V2, blind 60 % right; "whatever she wants" was weak. A not-my-job reading replaces it.
    // why: exact steps ← the question taken literally (何をしてほしい？); not his ← "What do you want me to do?" heard as
    //   passing the problem back to her
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'whatdo', seg: [65.6, 70.55],
      stem: 'When Leslie tells Ben to do something, what is his reply doing?',
      choices: ['Pushing back that there’s little he can do', 'Asking her for the exact steps to follow', 'Saying the stand isn’t his to deal with'], a: 0,
      cue: '彼の返事の形と、彼女の言い返し。',
      line: 'Ben, do something. — *What do you want me to do?* — Well, you’re the city manager…',
      said: '「何とかして」に「どうしろって言うの？」と返し、「市政管理官でしょ」と言われる。',
      mean: '答えを求める質問ではなく、「打つ手がない」という反論。',
      trap: '文字どおり指示を求める質問に聞こえやすい。相手が理由で言い返したら、反論だった印。',
      use: 'What do you want me to do?（どうしろって言うの？）' },

    // R fix: V2, blind 55 % right; "posted somewhere bigger" was a filler. A you/I mishearing ("sign you made") replaces
    //   it, and all three now start "The rules".
    // why: his own ← "that wooden sign you made" heard as "I made"; too small ← "wooden sign" heard as a complaint about
    //   the sign itself
    { id: 'i1', skill: 'infer', level: 'C1', point: 'sign', seg: [70.6, 79.45],
      stem: 'What is Ben suggesting when he asks about the “rules of conduct”?',
      choices: ['The rules are a cute sign, not real law', 'The rules are his own, from a sign he made', 'The rules are too small for vendors to read'], a: 0,
      cue: '「do you mean」のあと、彼が言い換える物。',
      line: 'By rules of conduct, do you mean *that wooden sign you made* that says, “Peas be kind to others”?',
      said: '「行動規範って、君が作った『人に優しく』みたいな木の看板のこと？」と聞き返す。',
      mean: '正式な規則でなく手作りの標語だ、という指摘。追い出す根拠にならない。',
      trap: '看板の文字や置き場所の話に聞こえやすい。do you mean は言い換えて弱める型。',
      use: 'By “soon,” do you mean today?（「すぐ」って、今日ってこと？）' },

    // R fix: V2, blind 80 % right; both distractors were easy to rule out. A by-mistake reading (puns heard as slips)
    //   replaces the memory one; the camera line settles it.
    // why: by mistake ← "Peas"/"romaine" heard as slips of the tongue; too strictly ← "rules of conduct" heard as strict
    //   orders
    { id: 'h2', skill: 'humor', level: 'C1', point: 'puns', seg: [74.1, 87.6],
      stem: 'What makes Leslie’s sign lines funny?',
      choices: ['She swaps in vegetable names on purpose', 'She mixes up vegetable names by mistake', 'Her signs boss people around too strictly'], a: 0,
      cue: '「Peas」「romaine」と、カメラへの一言。',
      line: '“*Peas* be kind to others”… in case of fire, *romaine calm*… I’m very good at *vegetable puns*.',
      said: 'please を peas、remain を romaine に替えた標語。カメラに「ダジャレは得意」。',
      mean: '決まり文句の一語を、音の近い野菜の名前に替えたダジャレ。',
      trap: 'うっかりにも聞こえるが、本人がダジャレは得意と言う。音の近い語はダジャレを疑う。',
      use: 'Sorry, bad pun.（ごめん、くだらないダジャレで）' },

    // why: funny ← "iffy" heard near "funny"; bad for business ← the market talk from her opening heard as his worry
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'iffy', seg: [87.5, 90.55],
      stem: 'What does Ben admit about the stand right after the puns?',
      choices: ['That it’s a little hard to defend', 'That it’s a little funny to watch',
                'That it’s a little bad for business'], a: 0,
      cue: '「Okay, I admit」のあと。',
      line: 'Okay, I admit this is *a little iffy*…',
      said: '「まあ、ちょっと微妙なのは認めるけど…」と言いかける。',
      mean: 'iffy ＝ 微妙、問題ありかも。言い切らずに、少しだけ認める言い方。',
      trap: 'iffy は辞書で見かけにくい口語。if（もしも）から「どうかな」の感じを思い出す。',
      use: 'The weather looks a little iffy.（天気がちょっと怪しい）' },

    // why: checking rules ← Ben's own plan from the market scene; moving ← the usual compromise script
    { id: 'd3', skill: 'detail', level: 'B2', point: 'revoke', seg: [101.2, 109.35],
      stem: 'What does Leslie bring up before the movie starts?',
      choices: ['Taking away the chard stand’s license', 'Checking the rules for city vendors',
                'Moving the chard stand somewhere else'], a: 0,
      cue: '「it would be very easy for you to」のあと。',
      line: 'it would be very easy for you to *revoke their license*.',
      said: '映画の前に「あの店のことだけど、許可を取り消すのは簡単でしょ」と切り出す。',
      mean: 'revoke ＝ 取り消す。店の営業許可を取り上げてほしい、という頼み。',
      trap: '市場でベンが言った「規則を確認する」と混ざりやすい。今は彼女の頼みの中身を聞く。',
      use: 'They revoked his driver’s license.（彼は免許を取り消された）' },

    // R fix: V2, blind 60 % right; "more power" was weak. A needs-approval reading of "emperor" replaces it. S3: the cue
    //   quoted "can't", a word only the key had.
    // why: council ← "not an emperor" heard as limited powers that need a vote; boss at home ← "this is city business"
    //   heard as being about who's in charge between them
    { id: 'i3', skill: 'infer', level: 'B2', point: 'emperor', seg: [109.3, 115.25],
      stem: 'What does Ben mean when he says he isn’t an emperor?',
      choices: ['He can’t act without a proper reason', 'He has to get the council’s okay first', 'He doesn’t want to be her boss at home'], a: 0,
      cue: '直後��一文の、最後の二語。',
      line: 'I’m *not an emperor*. I can’t just kick them out *for no reason*.',
      said: '「僕は皇帝じゃない。理由もなく追い出せない」と言う。',
      mean: '好きに決められる独裁者ではない。手続きと理由が要る、という説明。',
      trap: '「皇帝じゃない」から権限や手続きの話に広げやすい。言いたいのは for no reason。',
      use: 'I’m not a magician, you know.（魔法使いじゃないんだから）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'canjust', reveals: ['emperor'], seg: [111.9, 115.25],
      stem: 'Type what he says: “I ___ kick them out for no reason.” (2 words)', answer: "can't just",
      cue: '「emperor」のあと、I の次の二語。',
      line: 'I *can’t just* kick them out for no reason.',
      said: '「理由もなく追い出すなんてできない」。can’t の t はほぼ消える。',
      mean: 'can’t just ＝ ただ〜するわけにはいかない。',
      trap: 't が消えて can just に聞こえやすい。can’t は母音が長く強め、can は弱く短い。',
      use: 'I can’t just leave without saying goodbye.（さよならも言わずに帰れない）' },

    // R fix: V2, blind 50 % right; "giving in" was weak. The Japanese まあ frame (softening before a yes) replaces it.
    // why: look at something ← "look" taken literally (見て); softens ← the Japanese frame of a pause word before agreeing
    //   (まあね)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', seg: [128.75, 136.6],
      stem: 'After Leslie’s demand, what does Ben’s first word do?',
      choices: ['Calls for attention before a serious point', 'Asks her to look at something he has', 'Softens things before he agrees to it'], a: 0,
      cue: '「Kick them out!」の直後、文頭の一語。',
      line: '*Look*, now that we’re working together again…',
      said: '「追い出して！」に「あのさ、また一緒に働くんだし…」と別の提案を始める。',
      mean: '文頭の look ＝「いいかい」「あのね」。大事な話を切り出す合図。',
      trap: '文字どおり「見て」と取りやすい。文頭で何も見せないなら、注意を引く一言。',
      use: 'Look, I know it’s late, but…（あのね、遅いのは分かってるけど…）' },

    // why: never ← "keep… separate" heard as a full ban; after dinner ← "home life" heard as a rule about the time of
    //   day
    { id: 'd4', skill: 'detail', level: 'B1', point: 'firewall', seg: [128.75, 142.2],
      stem: 'What rule does Ben suggest for the two of them?',
      choices: ['Talk about work only at City Hall', 'Never talk about work with each other',
                'Talk about work only after dinner'], a: 0,
      cue: '「like, we only…」のあと。',
      line: 'we *only talk about work stuff when we’re at City Hall*, like a firewall system.',
      said: '「家庭と仕事を分けよう。仕事の話は市役所にいるときだけ」と提案する。',
      mean: 'firewall ＝ 防火壁。二つの世界の間に壁を作る、というたとえ。',
      trap: 'separate だけ聞くと全面禁止に聞こえる。only … when で場所の条件が付く。',
      use: 'Let’s not talk about work at dinner.（夕食の時は仕事の話はやめよう）' },

    // R fix: V2, blind 75 % right; "Ben gives up" was weak. A broke-it-at-home reading (she stayed up all night)
    //   replaces it.
    // why: breaks it ← "I stayed up all night" heard as work talk at home; drops ← "that's smart… home is home" heard as her
    //   backing off
    { id: 'g2', skill: 'gist', level: 'B2', point: 'loophole', reveals: ['office'], seg: [128.75, 198.5],
      stem: 'What becomes of Ben’s idea for keeping work and home apart?',
      choices: ['Leslie turns it into a way to corner him', 'Leslie agrees, then breaks it that night', 'Leslie quietly drops the chard stand issue'], a: 0,
      cue: '最後の場面の「Firewall, man.」。',
      said: 'ベンが仕事と家庭を分けようと言い、彼女は同意。だが駐車場で「ここは職場」と話を再開する。',
      mean: '彼が作ったルールが、彼女が彼を追いつめる道具になる。',
      trap: '徹夜したので約束を破ったようにも聞こえるが、話を出すのは駐車場。最後まで聞いて決める。',
      use: 'That plan didn’t last long.（その計画は長続きしなかった）' },

    // R fix: V2, blind 65 % right; "let it go for good" was easy to rule out. A leave-it-to-him reading replaces it.
    // why: let him decide ← "We can always talk about this" heard as giving him time; at home ← "talk about this" caught,
    //   "at the office" missed
    { id: 'i2', skill: 'infer', level: 'C1', point: 'office', seg: [141.95, 149.9],
      stem: 'What does Leslie’s last remark before the movie suggest she plans?',
      choices: ['To bring it up again, only at work', 'To let him decide on it by himself', 'To talk it over again at home later'], a: 0,
      cue: '「tomorrow」のあとの場所。',
      line: 'Home is home and work is work. We can always *talk about this tomorrow at the office*.',
      said: '「家は家、仕事は仕事。この話は明日、職場ですればいい」と同意する。',
      mean: '同意しつつ、話を続ける気は満々。場所を変えて、また持ち出すという予告。',
      trap: 'that’s smart で引き下がったと取りやすい。can always のあとに「やめない」が出る。',
      use: 'We can always try again tomorrow.（明日またやればいいよ）' },

    // R fix: V2, blind 70 % right; "can also" didn't sound like the line. A swallowed "-ways" (can all) replaces it.
    // why: could always ← the k- start of "can" heard as "could"; can all ← "-ways" swallowed; can't always ← the weak
    //   "can" heard with a t
    { id: 's1', skill: 'sound', level: 'B2', point: 'office', seg: [143.45, 147.8],
      stem: 'Fill the gap: “We ___ talk about this tomorrow at the office.”',
      choices: ['can always', 'can’t always', 'can all', 'could always'], a: 0,
      cue: '「We」のあと、talk の前の二語。',
      line: 'We *can always* talk about this tomorrow at the office.',
      said: '「明日、職場で話せばいいよね」。can は弱く「クン」に近い。',
      mean: 'can always ＝ いつでも〜できる。「今じゃなくてもいい」の決まった言い方。',
      trap: '-ways が弱く can all にも聞こえる。can’t なら母音が強く長い。',
      use: 'You can always call me.（いつでも電話してね）' },

    // R fix: V2, blind 50 % right; "found nothing" contradicted her line. A curious reading of the question replaces it.
    // why: relieved ← "I found the legal precedent" heard as solving his problem; curious ← "What is happening?" heard as
    //   interest in what she found
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'happening', seg: [159.85, 164.55],
      stem: 'How does Ben react when Leslie raises the chard stand again?',
      choices: ['Caught off guard by her move', 'Relieved she found a way out', 'Curious to hear what she found'], a: 0,
      cue: 'ベンの短い一言の形。',
      line: '…I found the legal precedent… — *What is happening?*',
      said: '彼女が「追い出せる法的な前例を見つけた」と言い出し、ベンは「何なの？」と返す。',
      mean: '約束したはずなのに、と面食らっている。状況についていけない一言。',
      trap: '短い疑問は興味にも聞こえる。約束したばかりなので、驚きの一言。',
      use: 'Wait, what is happening right now?（待って、今何が起きてるの？）' },

    // R fix: V2, blind 65 % right; "forgotten the rule" was weak. An admits-breaking-it reading replaces it. C5: the stem
    //   quotes "What is happening?", a2's evidence, so it reveals `happening`.
    // why: admits ← "now we're at work. Let's do this" heard as owning up; car = home ← right words, wrong direction:
    //   "parking lot" heard as still being off duty
    { id: 'h3', skill: 'humor', level: 'C1', point: 'loophole', reveals: ['happening'], seg: [163.45, 170.72],
      stem: 'Why is Leslie’s answer to “What is happening?” funny?',
      choices: ['She uses his own rule to talk shop anyway', 'She breaks his rule and openly admits it', 'She thinks the car counts as being at home'], a: 0,
      cue: '「technically」のあとの理屈。',
      line: '*Firewall, man.* … this is *technically City Hall property*, so now we’re at work.',
      said: '「ファイアウォールよ。駐車場は厳密には市役所の敷地。だから今は仕事中」と言う。',
      mean: '彼の決めたルールを、言葉どおりに守るふりで逆手に取る。',
      trap: '破ったと認めたようにも見えるが、technically で「破っていない」と言い張る。へ理屈の合図。',
      use: 'Technically, it’s still lunchtime.（厳密に言えば、まだ昼休みだよ）' },

    // why: 58 ← "a hundred" swallowed at speed; 150 ← the final "-eight" lost; 180 ← "-fifty-eight" blurred into
    //   "eighty"
    { id: 'n1', skill: 'number', level: 'B1', point: 'reasons', seg: [176.1, 181.8],
      stem: 'How many reasons does Leslie hand Ben to kick the stand out?',
      choices: ['58', '150', '158', '180'], a: 2, keep: true,
      cue: '「here’s」のすぐあと。',
      line: 'if you’re looking for a reason to kick them out, here’s *158*.',
      said: '「追い出す理由が欲しいなら、ここに158個ある」と新しい規則集を渡す。',
      mean: '理由は一つで足りるのに158個。彼女の本気がこの数に出ている。',
      trap: '大きな数は途中が抜けやすい。hundred と、最後の eight まで聞く。',
      use: 'I can give you ten reasons.（理由なら10個言えるよ）' },

    // R fix: V2, blind 75 % right; "lunch break" and "weekend" were fillers. A stay-up/get-up near miss and the movie
    //   night just before replace them.
    // why: got up early ← "stayed up" and "got up" sound alike; during the movie ← they were watching a film that night
    { id: 'd5', skill: 'detail', level: 'B1', point: 'allnight', seg: [181.6, 184.7],
      stem: 'When did Leslie make the rule book?',
      choices: ['She stayed up all night on it', 'She got up early this morning for it', 'She worked on it during the movie'],
      a: 0,
      cue: '「When did you make this?」への答え。',
      line: '*I stayed up all night*.',
      said: '「これ、いつ作ったの？」と聞かれ、「徹夜した」と答える。',
      mean: 'stay up all night ＝ 徹夜する。前の晩、家でずっとこれに取り組んでいた。',
      trap: 'stay up と get up は形が似ている。stay up は「寝ずに起きている」。',
      use: 'I stayed up all night studying.（徹夜で勉強した）' },

    // anchor: 136.8–139.4 s Ben's rule is "we only talk about work stuff when we're at City Hall"; 183.4–184.6 s
    //   "I stayed up all night": she spent the night at home on work, without ever talking about it
    // why: too tired ← right target, wrong direction: the deal wasn't broken, since she never talked shop at home;
    //   toffee ← "I also made these" heard as what kept her up
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'allnight', seg: [181.6, 191.25],
      stem: 'Given their home-and-work deal, why is “I stayed up all night” funny?',
      choices: ['She kept the letter of the deal, not the spirit', 'She was too tired to keep the deal last night',
                'She stayed up making toffee, not a rule book'], a: 0,
      cue: '取り決めの動詞「talk」と、彼女がしたこと。',
      line: 'we only *talk about* work stuff when we’re at City Hall… — *I stayed up all night*.',
      said: '「仕事の話は市役所でだけ」と決めた夜、彼女は家で徹夜して158項目の規則集を作っていた。',
      mean: '決めたのは「話さない」こと。話さずに作業はした。ルールの文字は守り、狙いは無視している。',
      trap: '疲れて約束を破った話と聞きやすい。取り決めの動詞が talk だった点を思い出す。',
      use: 'Technically, I didn’t break any rules.（厳密には、ルールは破ってない）' },

    // R fix: V2, blind 50 % right; "no toffee at all" was weak. A different-sweet reading of "surprise" replaces it.
    // why: different sweet ← "surprise" expected to be a twist; note ← the treats are tied to the license, so a hidden
    //   message fits
    { id: 'h4', skill: 'humor', level: 'B2', point: 'toffee', seg: [184.7, 191.25],
      stem: 'What’s funny about the “surprise” in Leslie’s treats?',
      choices: ['It’s just what the name already says', 'It’s a note about the chard stand inside', 'It’s a different sweet hidden inside'], a: 0,
      cue: '「The surprise is」のあと。',
      line: 'Leslie’s *Toffee* Surprise. The surprise is *there’s toffee* in the inside.',
      said: '「トフィー・サプライズ」を見せ、「サプライズは、中にトフィーが入っていること」と言う。',
      mean: '名前に書いてある物が、そのまま「驚き」。期待を外すオチ。',
      trap: 'surprise と聞くと意外な中身を待ってしまう。名前の語がそのまま繰り返される点を聞く。',
      use: 'The secret ingredient is love.（隠し味は愛情です）' },

    // R fix: V2, blind 75 % right; "save for the vendors" was a filler. A once-as-later reading replaces it.
    // why: sorry ← treats after a quarrel heard as a peace offering (お詫びの品); later ← "once" heard as いつか, a time,
    //   not a condition
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'once', reveals: ['revoke'], seg: [191.15, 195.9],
      stem: 'What is Leslie doing when she tells Ben when he can eat them?',
      choices: ['Making the treats his reward for doing it', 'Offering the treats to say sorry to him', 'Telling him to save the treats for later'], a: 0,
      cue: '「You can eat those」のあとの once。',
      line: 'You can eat those *once you revoke* the chard vendor’s license.',
      said: '「あの店の許可を取り消したら、それ食べていいわよ」と言う。',
      mean: 'once ＝ 〜したら。お菓子を、言うことを聞いたごほうびにしている。',
      trap: 'once を「いつか」と取ると、あとで食べてね、に聞こえる。once のあとは条件。',
      use: 'You can have dessert once you finish.（食べ終わったらデザートね）' },

    // anchor: 164.6–169.6 s "Firewall, man… this is technically City Hall property, so now we're at work"; 194.9–197.6 s
    //   "Good day, colleague" closes that work-only talk
    // R fix: V2, blind 65 % right; "After 'Firewall, man'" in the stem pointed at the rule. The stem names only the
    //   sign-off now, and the key doesn't say "his rule".
    // why: cold ← the Japanese frame: sudden formal words between partners heard as anger (よそよそしい); no longer a
    //   couple ← right mechanism, wrong scope: the role covers only "at work", not their relationship
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'colleague', seg: [191.15, 198.5],
      stem: 'Why does Leslie sign off with “colleague”?',
      choices: ['She’s playing along with being at work', 'She’s being cold because she’s angry', 'She’s joking they’re no longer a couple'], a: 0,
      cue: '駐車場で彼女が言った「now we’re…」の続き。',
      line: 'You can eat those once you revoke the chard vendor’s license. *Good day, colleague*.',
      said: '「許可を取り消したらお菓子を食べていいわ。ごきげんよう、同僚さん」と言って去る。',
      mean: '恋人でなく「同僚」と呼ぶのは、「ここは職場」という彼のルールに乗った演技。ルールで押し切る締め。',
      trap: '急に改まった呼び方は怒りに聞こえやすい。直前の「今は仕事中」の続きとして聞く。',
      use: 'Pleasure doing business with you.（取引成立ね）' }
  ]
};
