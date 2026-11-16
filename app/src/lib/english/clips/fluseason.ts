// REVIEW 2026-11-16: pass 5, fix 17, drop 2, new 0; ear checks 2
// REVIEW Q: h1 and nt3 were deleted on the assumption this bank has never shipped; if it has, restore them with
//   `retired: true` instead.
// “People Are Getting Sick Again?! | Parks and Recreation” (the official Parks and Recreation channel, Season 6): Leslie
// wages war on flu season, the concert's teen headliner drops out, and she and Andy set off to win him back, ending at
// a pharmacy where she insists she has the flu.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 172 s; whisper's last line is filler.
// Untested: the song lyrics at 57–67 s (sung over music), the shouting at 107–116 s (the captions garble it: "not it
// larry sorry"), "Heimlich!" at 136 s (whisper only), Andy's "Two?!" at 142.7 s (delight or outrage rests on tone), and
// "This counts as one" at 172 s (the joke is on screen). The fans' name and the singer's name are spelled three ways
// across the sources; nothing turns on spelling.
// EAR CHECK: 25 s nt2 — Larry's request: captions "can I just work from home", whisper "can I just work football"
//   (assumed "from home"; nt2's key rests on Leslie's reply, but its last distractor quotes the request)
// EAR CHECK: 140 s p2 — captions "the canyon aisles", whisper "the candy aisles" (assumed "candy": the reply "you can
//   buy two candies" is in both)
import type { Clip } from '../types.ts';

export const fluSeason: Clip = {
  id: 'fluseason', video: '7DxKsVWI1EA', title: 'People Are Getting Sick Again?!', dur: 194, wpm: 157, band: 'mid',
  tags: ['職場', '買い物'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind pass 80 % ("Well, I'd have to check" is the stock phrase, so the bare pronoun gave it away); the gap
    //   now takes the whole modal chunk, with "I'll have to" as an equally idiomatic near sound
    // why: I have to ← the d of "I'd" all but vanishes before "have"; I'll have to ← a promise to check reads just as
    //   naturally, and 'd/'ll are both a faint tongue tap; I had to ← "I'd" heard as the past "I had"
    { id: 's1', skill: 'sound', level: 'B2', point: 'check', seg: [0.3, 5.9],
      stem: 'Fill the gap: “Well, ___ check, but I’m pretty sure…”',
      choices: ['I’d have to', 'I have to', 'I’ll have to', 'I had to'], a: 0,
      cue: '最初の Well のすぐあと、とても短い音。',
      line: 'Well, *I’d have to* check, but I’m pretty sure…',
      said: '「確認しないとだけど、たぶん大丈夫」と答えている。',
      mean: 'I’d は I would。「確認するとしたら」と控えめに言う形で、d はほとんど聞こえない。',
      trap: 'd が消えて I have に聞こえやすい。控えめな I’d は前置きの定番。',
      use: 'I’d have to ask my boss.（上司に聞いてみないと）' },

    // R fix: blind pass 70 % (the title made the only flu choice the key); all three choices now turn on the flu
    // why: over it ← "I've had the flu before, and I've worked through it" heard as being past it; just a cold ← the
    //   pharmacist's "that doesn't seem like the flu" heard as a verdict she accepts
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['flu'], seg: [10, 165],
      stem: 'How does Leslie’s own situation change between the start and the end?',
      choices: ['She goes from guarding against the flu to saying she has it',
                'She goes from having the flu to saying she is over it',
                'She goes from fearing the flu to learning it is just a cold'], a: 0,
      cue: '冒頭の注意の言葉と、最後の薬局での一言。',
      said: '最初は「病気になれない」と注意し、最後は薬局で「インフルエンザなの」と言う。',
      mean: '感染を一番警戒していた本人が、病気だと言って薬を買う側に回る流れ。',
      trap: 'worked through it で回復、薬剤師の一言で風邪と取りやすい。最初と最後を比べる。',
      use: 'Of all people, I got sick.（よりによって私が風邪をひくなんて）' },

    // R fix: blind pass 80 % (the stem's "warns" plus two weak distractors); the stem is neutral and each distractor
    //   is a real sense of "drop"
    // why: quitting ← "drop out" (said later in the clip) = 辞める; stopping by ← "drop by" = 立ち寄る
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'flies', seg: [17.6, 23.5],
      stem: 'When Leslie talks about the people around them, what does she say is happening?',
      choices: ['They’re getting sick one after another', 'They’re quitting their jobs one after another',
                'They’re stopping by her office one after another'], a: 0,
      cue: '「people are」のあと、たとえの言い方。',
      line: 'People are *dropping like flies*.',
      said: '「みんなバタバタ倒れてる」と、何にもさわるなと注意する。',
      mean: 'drop like flies ＝ 次々に倒れる・病気になる。ハエが落ちるように、というたとえ。',
      trap: 'drop out（辞める）や drop by（寄る）と混ざりやすい。前後の話題で判断。',
      use: 'Everyone at school is dropping like flies.（学校でみんな次々倒れてる）' },

    // R fix: blind pass 55 % (only quarantine fitted the flu theme); sick leave fits it as well, and "work from home"
    //   is Larry's own request
    // why: sick leave ← the usual flu script; work from home ← Larry asks for exactly that right after
    { id: 'd2', skill: 'detail', level: 'B1', point: 'larry', seg: [18.0, 23.5],
      stem: 'What has Leslie already had to do with Larry?',
      choices: ['Put him in quarantine', 'Put him on sick leave', 'Let him work from home'], a: 0,
      cue: '「We already have to」のあと。',
      line: 'We already have to *quarantine Larry*.',
      said: '「もうラリーは隔離しなきゃいけなかった」と言う。',
      mean: 'quarantine ＝ 隔離する。感染を防ぐため、ほかの人から離しておく。',
      trap: 'すぐあとに在宅の頼みが出るので、それと混ざりやすい。動詞 quarantine を聞き取る。',
      use: 'They quarantined the whole floor.（フロアごと隔離された）' },

    // R drop h1: same point, segment and reading as nt2 ("he'll live in the tent for good"); nt2 asks it better

    // R fix: blind pass 60 % ("taken as serious" pointed at the most extreme choice); a near miss now has the right
    //   direction but the wrong scope, and the everyday "mail to his house" filler is gone
    // why: until the fever ← right idea (stay out there), wrong scope; work from home ← "home" is handed back, so it
    //   sounds like a yes to his request
    // anchor: 26.3–28.7 s "The tent is your home now, Larry. We already forwarded your mail": "home" is redefined as the
    //   tent, and forwarding mail is what you do when you move, not for a few sick days
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'tent', reveals: ['larry'], seg: [21.3, 29.6],
      stem: 'Taken as a serious answer, what would Leslie’s reply tell Larry?',
      choices: ['He lives out there now, with no end date', 'He stays out there only till his fever is gone',
                'He may work from home, just as he asked'], a: 0,
      cue: '頼みに出た home を、返事でどう言いかえたか。',
      line: '*The tent is your home now*, Larry. We already *forwarded your mail*.',
      said: 'ラリーの「家で仕事していい？」に、「テントが君の家だ。郵便も転送済み」と返す。',
      mean: 'home をテントに言いかえ、在宅の頼みを「ずっとテント」に変えた。郵便の転送は引っ越しの手続き。',
      trap: '「治るまで」と取りやすいが、数日なら郵便は転送しない。相手の語を返す返事は意味をずらしがち。',
      use: 'A break? This is your break.（休憩？今がその休憩だよ）' },

    // why: Seven ← the "-teen" is missed and only "seven" stays; Seventy ← -teen/-ty, blurred by "year-old"
    { id: 'n1', skill: 'number', level: 'B1', point: 'age', seg: [40.0, 44.8], keep: true,
      stem: 'How old is Chip McCapp, the country singer?',
      choices: ['Seven', 'Seventeen', 'Seventy'], a: 1,
      cue: '「the most amazing」のあと、year-old の前。',
      line: 'the most amazing *17-year-old* country singer',
      said: '「世界で一番すごい17歳のカントリー歌手」と紹介する。',
      mean: 'seventeen は -teen を強く長く、seventy は前の SEV を強く言う。',
      trap: '-teen と -ty は強勢の位置も違う。year-old が続くとまぎれやすい。',
      use: 'She’s only seventeen, can you believe it?（まだ17歳なんだって）' },

    // R fix: blind pass 60 % (only one choice was about fans); a distractor now has the fans in the wrong relation
    // why: nickname for Chip ← "chipmunks" sounds built from "Chip", and fans do nickname stars; backup band ← "we are
    //   huge chipmunks" heard as a band introducing itself
    { id: 'd3', skill: 'detail', level: 'B1', point: 'chipmunks', seg: [44.4, 48.1],
      stem: 'In the talk about Chip McCapp, who are the “chipmunks”?',
      choices: ['What his fans call themselves', 'What his fans like to call him', 'The name of his backup band'], a: 0,
      cue: '「huge chipmunks」のすぐあとの説明。',
      line: '*That’s what his fans call themselves.*',
      said: '「僕らは熱烈なチップマンクス。ファンの自称なんだ」と説明する。',
      mean: 'ファンの呼び名の説明。huge は「熱烈な」の意味で、体の大きさではない。',
      trap: 'Chip に似た語なので本人のあだ名と取りやすい。themselves は「自分たちを」。',
      use: 'What do his fans call themselves?（彼のファンは自分たちを何て呼んでるの？）' },

    // R fix: blind pass 70 % (the key was the only choice naming a mismatch); the army-protest filler is now a real
    //   misreading of where the laugh comes from
    // why: babyish ← "beautiful like my mom" taken as the joke on its own, before the parentheses; thanks mom ←
    //   "support" attached to the mom in the title
    { id: 'h2', skill: 'humor', level: 'C1', point: 'song', seg: [50.4, 57.4],
      stem: 'What makes the title of Chip’s latest song funny?',
      choices: ['It tacks a troops slogan onto a song about Mom', 'A teen calling his mom beautiful sounds babyish',
                'It thanks his mom for always supporting him'], a: 0,
      cue: '曲名の後半、parentheses のあと。',
      line: '*“Beautiful Like My Mom,” parentheses, “Support the Troops”*',
      said: '最新曲の題名は「ママみたいにきれい（兵士を応援しよう）」だと紹介する。',
      mean: 'ママの歌に、関係のない「兵士を応援」がかっこ書きで付く。そのずれが笑い。',
      trap: 'support で「ママが支えてくれた」、前半だけで「幼い」と取りやすい。かっこの中は別のテーマ。',
      use: 'What’s that got to do with anything?（それ何の関係があるの？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'getrid', seg: [71.6, 76.0],
      stem: 'Type the line: “…I can ___ awesome wish list.” (4 words)', answer: 'get rid of my',
      cue: '「headliner」のあと、I can に続く部分。',
      line: 'I can *get rid of my* awesome wish list.',
      said: '「ヘッドライナーが決まったし、希望リストは捨てられる」と言う。',
      mean: 'get rid of ＝ 処分する。t が弾み、rid of もつながり「ゲリダヴ」に近い。',
      trap: 'of は弱く「ア」程度で聞き落としやすい。3語でひとかたまり。',
      use: 'I need to get rid of old clothes.（古い服を処分しなきゃ）' },

    // R fix: blind pass 65 % ("far away" was a filler); a distractor is now the near idiom "worth a shot"
    // why: worth a try ← "shot" heard as in "give it a shot"; costly ← the usual reason a big act is out of reach
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'longshots', seg: [74.2, 78.6],
      stem: 'How does the reply describe the acts on the wish list?',
      choices: ['Unlikely to ever agree', 'Worth a try all the same', 'Far too costly to book'], a: 0,
      cue: '「Yeah」で始まる返事。',
      line: 'Yeah, *those are long shots*.',
      said: '「まあ、どれも望み薄だね」と返す。',
      mean: 'long shot ＝ 当たる見込みの低いこと。リストを捨てる話に Yeah と同意している。',
      trap: 'give it a shot（やってみる）と混ざりやすい。Yeah はリストを捨てることへの同意。',
      use: 'It’s a long shot, but let’s try.（望み薄だけど、やってみよう）' },

    // R fix: blind pass 55 %; V4/V5: the reason is said outright ("they could get Bob Dylan to come"), so infer C1 →
    //   detail B2 (the causative "get… to come" is the hard step); the cover-band filler is now a backstory reading
    // why: played with Dylan ← "Bob Dylan's friends" heard as his old bandmates; cheaper ← "long shots" heard as about cost
    { id: 'i3', skill: 'detail', level: 'B2', point: 'wishlist', seg: [76.6, 80.9],
      stem: 'Why was “Bob Dylan’s friends” on the wish list?',
      choices: ['They might bring Bob Dylan along', 'They once played in Dylan’s band',
                'They would cost less than Dylan himself'], a: 0,
      cue: '「I just thought」のあと。',
      line: 'I just thought maybe *they could get Bob Dylan to come*.',
      said: '「その友だちがボブ・ディランを連れてきてくれるかもと思って」と説明する。',
      mean: '友だちを呼べば本人も来るかも、という遠回りの作戦。発想が子どもっぽい。',
      trap: '昔のバンド仲間と取りやすい。get A to come ＝ Aに来てもらう。',
      use: 'Maybe she can get her boss to come.（彼女が上司を連れてきてくれるかも）' },

    // why: Two ← "ten" and "two" are both short t-words; Twenty ← the t of "twenty" softens, and "ten" can sound like it
    { id: 'n3', skill: 'number', level: 'B1', point: 'split', seg: [82.4, 86.6], keep: true,
      stem: 'How long ago did the band’s lead singer leave?',
      choices: ['Two years ago', 'Ten years ago', 'Twenty years ago'], a: 1,
      cue: '「lead singer split」のあと。',
      line: 'Their lead singer split *10 years ago*.',
      said: '「ボーカルは10年前に抜けた」と言う。',
      mean: 'split ＝ 別れる・抜ける。ここではバンドを離れたこと。',
      trap: 'ten は短く、twenty は t が弱まり「トゥウェニー」に近い。数の母音と長さで判断。',
      use: 'We split up two years ago.（2年前に別れた）' },

    // why: retired ← "ten years ago" suggests they're old now; name ← "titled their last album" heard as a fight over
    //   a title
    { id: 'i2', skill: 'infer', level: 'B2', point: 'landho', seg: [82.4, 89.5],
      stem: 'Why is a Land Ho reunion out of the question?',
      choices: ['The singer left and promised never to return', 'The band members have all retired from music',
                'The band has lost the legal right to its name'], a: 0,
      cue: '「He titled」のあと、アルバムの名前。',
      line: 'He titled their last album *“We’ll Never Reunite.”*',
      said: '「ボーカルが最後のアルバムを“二度と再結成しない”と名づけた」と言う。',
      mean: 'アルバム名でまで宣言したので、再結成の望みはない。名前そのものがオチ。',
      trap: '昔の話なので引退と取りやすい。titled のあとの名前に、答えがそのまま入っている。',
      use: 'No way they’ll ever get back together.（あの二人がよりを戻すなんてありえない）' },

    // R fix: blind pass 60 % (the key was the only choice with a place name, and the only specific plan); the place
    //   is gone, and each distractor is a plan the scene makes plausible
    // why: wish list ← the list came up just before; no headliner ← "there are no hands" and "you and I need to handle
    //   this" heard as making do with what they have
    { id: 'g1', skill: 'gist', level: 'B2', point: 'trip', seg: [92.9, 124.4],
      stem: 'What does Leslie decide to do about the concert?',
      choices: ['Go and talk Chip into doing it after all', 'Book a new headliner off the wish list',
                'Hold the concert with no headliner at all'], a: 0,
      cue: '「All we need to do is」のあと。',
      line: 'All we need to do is *go to Indianapolis, convince Chip* to do the festival',
      said: '歌手が出演をやめ、人手もない。二人でインディアナポリスへ説得に行くと決める。',
      mean: '代わりを探すのではなく、本人を説得しに行く。ここから二人の出張の話になる。',
      trap: '直前の希望リストから代役探しと取りやすい。convince で同じ歌手を呼び戻すと分かる。',
      use: 'All we need to do is ask nicely.（ていねいに頼めばいいだけ）' },

    // R fix: blind pass 70 % ("raise a hand to vote" was a filler); the literal reading now fits the flu theme
    // why: wait ← "okay" + bad news reads like a call to calm down; clean hands ← "hands" taken literally, in a clip
    //   about not touching anything
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'hands', seg: [97.8, 101.9],
      stem: 'After the bad phone call, what does Leslie first say they need?',
      choices: ['Everyone to pitch in and help', 'Everyone to stay calm and wait', 'Everyone to keep their hands clean'],
      a: 0,
      cue: '「Okay」のすぐあと、hands を使った言い方。',
      line: 'we need *all hands on deck*.',
      said: '「総出で取りかからないと」と言い、すぐ「でもその手がない」と続ける。',
      mean: 'all hands on deck ＝ 総動員。船の甲板に全員を呼ぶ号令から。',
      trap: 'かぜの話が続くので「手洗い」と取りやすい。直後の「手がない」は人手のこと。',
      use: 'It’s all hands on deck this weekend.（今週末は総出だよ）' },

    // why: flu ← the whole clip is about people getting sick; concert ← the concert is the topic of the moment
    { id: 'd4', skill: 'detail', level: 'B1', point: 'winery', reveals: ['hands'], seg: [97.8, 101.9],
      stem: 'Why is nobody around to help Leslie?',
      choices: ['Everyone is at the winery', 'Everyone is home with the flu', 'Everyone is busy with the concert'], a: 0,
      cue: '「because」のあと、最後の一語。',
      line: 'because *everybody’s at the winery*.',
      said: '「人手が必要なのに、みんなワイナリーに行ってていない」と言う。',
      mean: 'ここは病気ではなく、ワイナリーに出かけているのが理由。',
      trap: 'インフルエンザの話が続くので病欠と取りやすい。because のあとの場所の語を聞く。',
      use: 'Everyone’s at lunch right now.（みんな今お昼に出てる）' },

    // R fix: blind pass 75 % ("snaps at him for calling her boss" was a filler); the distractors are now a concession
    //   and her own earlier move on Andy
    // why: take it easy ← "I've had the flu before" heard as a reason to go slow; turns it on Andy ← she asked him
    //   "are you getting sick?" at the start
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'fine', seg: [124.2, 129.4],
      stem: 'When Andy checks on her before the trip, how does Leslie answer?',
      choices: ['She waves off his worry and pushes on', 'She agrees to take it easy on the trip',
                'She turns the question back on Andy'], a: 0,
      cue: '「boss」のあと、すぐに返す短い答え。',
      line: '*I’m fine.* I’ve had the flu before, and *I’ve worked through it*.',
      said: '「大丈夫、前も働きながら乗りきった」と答える。',
      mean: 'work through it ＝ 休まず乗りきる。心配を受け流し、予定どおり行く意思。',
      trap: 'had the flu から「無理しない」と取りやすい。worked through は休まないこと。',
      use: 'I’m fine. I’ll work through it.（大丈夫、このままやりきる）' },

    // R drop nt3: blind pass 75 % (the stem's "next to how she treated Larry" points at a double standard), and the
    //   anchor (Larry sent to the tent, 21–29 s) lies 100 s outside the segment (S4); the C2 rule allows one rewrite,
    //   and no segment can hold both

    // R fix: blind pass 50 % ("never learned first aid" was weak); the distractors are now two readings of "uh, or
    //   karate": a slip, and a confession
    // why: admits ← "or karate" heard as owning up that karate is all he knows; mixes up ← "uh, or" heard as a slip
    //   of the tongue between two class names
    { id: 'h4', skill: 'humor', level: 'C1', point: 'karate', seg: [129.3, 135.7],
      stem: 'Why does the talk about first aid get a laugh?',
      choices: ['He insists karate counts as first aid', 'He admits karate is all he really knows',
                'He mixes up the names of two classes'], a: 0,
      cue: '「luckily I know」のあと、or に続く語と返事。',
      line: 'luckily I know first aid. Uh, *or karate*. — That’s not first aid. — *It is if you do it right.*',
      said: '応急手当、いや空手、と言い、「それは違う」に「上手くやればそうなる」と返す。',
      mean: '空手は人を助ける技ではない。それでも言い張る、ずれた自信がおかしい。',
      trap: '言いよどみや白状と取りやすい。It is if… と言い返すので、本気だと分かる。',
      use: 'Technically, that counts.（厳密には、それもありだよ）' },

    // R fix: blind pass 50 % ("really doing" flagged a hidden meaning, and "wait outside" was a filler); the stem is
    //   neutral, and a kind reading replaces the filler
    // why: promise ← "but won't get any" taken at face value; for her ← she's sick, so candy reads as a get-well treat
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'candy', seg: [137.3, 143.4],
      stem: 'When Andy mentions the candy aisles, what is he doing?',
      choices: ['Hinting he wants her to OK some candy', 'Promising her he won’t buy any candy',
                'Offering to get her candy to cheer her up'], a: 0,
      cue: '「candy aisles」のあと、but で続く部分と返事。',
      line: 'I’ll just stroll through the candy aisles, *but won’t get any*. — *You can buy two candies.*',
      said: '「お菓子売り場を歩くだけ、買わないけど」に「2つまでならいいよ」と返される。',
      mean: 'わざと「買わない」と言うのは、遠回しのおねだり。返事もそう受け取っている。',
      trap: '「買わない」を約束と取りやすい。言わなくていいことを言うときは、裏の頼みを疑う。',
      use: 'I’ll just look, I won’t buy anything…（見るだけ、買わないから…）' },

    // R fix: blind pass 50 %, and K1: "whatever a famous singer would take for the flu" was the key in other words; it
    //   is now the endorsement reading of "Mariah"
    // why: voice ← "sing tonight" taken as her own need; brand ← "Mariah" heard as a celebrity advert, not a picture of
    //   how strong
    // anchor: 150.1–152 s "I have a ton of work to do, so I need the good stuff": the need is work, not singing, and
    //   the Mariah phrase restates "the good stuff"
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'goodstuff', seg: [149.8, 156.8],
      stem: 'Which plain-English version keeps what Leslie asks the pharmacist for?',
      choices: ['The strongest kind, what a star takes to get on stage',
                'Something for her voice, since she must sing tonight',
                'The brand that a famous singer is paid to advertise'], a: 0,
      cue: '「a ton of work」のあと、the good stuff の言いかえ。',
      line: 'so I need *the good stuff*. The *“Mariah needs to sing tonight”* stuff.',
      said: '仕事が山ほどあるから「効くやつ」、「今夜マライアが歌う時の」やつがほしい、と言う。',
      mean: 'the good stuff ＝ 一番効くやつ。スターの本番前という例えで強さを言うだけ。歌う予定も広告もない。',
      trap: '歌手名と sing で喉の薬や広告と取りやすい。例えの前の理由（仕事）が本当の用件。',
      use: 'Give me the good stuff, please.（いちばん効くのをください）' },

    // R fix: blind pass 55 %; the key was the only choice that questioned the diagnosis, worded close to the stem
    // why: almost over ← "no signs of fever" heard as recovery; doctor ← the usual pharmacy script ("see a doctor
    //   first")
    { id: 'i4', skill: 'infer', level: 'C1', point: 'notflu', seg: [156.7, 161.8],
      stem: 'After looking Leslie over, what is the pharmacist suggesting?',
      choices: ['Her signs don’t fit the flu she claims', 'Her flu is nearly over, so she needs little',
                'She must see a doctor before he sells her any'], a: 0,
      cue: '見た目の話のあと、the flu を使った最後の文。',
      line: 'No signs of fever. *That doesn’t seem like the flu.*',
      said: '「顔も赤くないし熱もない。インフルエンザっぽくない」と言う。',
      mean: '症状が合わないので、別の原因があるのでは、とやんわり言っている。',
      trap: '熱がない＝治りかけ、と取りやすい。doesn’t seem like the flu は病名そのものを疑う言い方。',
      use: 'That doesn’t sound like a cold to me.（それ、風邪っぽくないね）' },

    // R fix: blind pass 70 % ("asks him what else it could be" was weak); a distractor now reads her hedge as doubt
    // why: not sure ← "I mean, I don't think it could be anything" heard as a hedge (〜とは思うけど); worry ← the line
    //   trails off, which can sound like fear
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'flu', reveals: ['notflu'], seg: [156.7, 165.0],
      stem: 'How does Leslie respond to the pharmacist’s doubt?',
      choices: ['She insists it’s the flu and brushes it off', 'She admits she isn’t sure what it is',
                'She starts to worry that it might be serious'], a: 0,
      cue: '薬剤師の言葉のすぐあと、短い一言と I mean。',
      line: '*It’s the flu.* I mean, I don’t think it could be anything.',
      said: '「インフルエンザよ。ほかの何かとは思えない」と言い切る。',
      mean: 'I mean で言い足しても、ほかの可能性を考えない。認めたくない気持ち。',
      trap: 'I don’t think を迷いと取りやすいが、先に It’s the flu. と言い切っている。',
      use: 'It’s just stress. It can’t be anything else.（ただのストレス。ほかに理由はないよ）' },
  ]
};
