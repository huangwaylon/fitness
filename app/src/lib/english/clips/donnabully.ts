// “Donna uncovers her anonymous bully | Parks and Recreation” (the official Parks and Recreation channel, Season 6):
// Donna's new boss can't bring herself to tell Donna off, so she takes Ron's "be direct" advice by posting an
// anonymous review instead; Donna traces it to City Hall and fires the wrong man; meanwhile Ron writes signed angry
// letters to everyone; in the end the boss confesses, Donna already knew, and they agree to say what they feel.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 235 s; whisper's lines after 246 s are
// a loop. Names in the audio: Donna, Ron ("Ron's advice"), Kyle (198 s). The boss is never named, so stems call her
// "Donna's boss". The sources differ at 210.7 s ("I tried Colin here" / "I tried Kyle in here") and spell "Mjolnir"
// differently; no key rests on those words, and the lines trim them. Untested: who says "that sucks" (47 s) and "who
// cares, really?" (69 s), the 165–166 s gap before "Because I believe it", and the vegan "made of glass" jab.
// EAR CHECK: 49.0 s s2, 54.8 s x1 — "have to" said as hafta (not "had to"); "hunt you down" linked (t‿y ≈ チュ);
//   both sources agree on the words
// REVIEW 2026-11-16: pass 6, fix 16, drop 1, new 1; ear checks 1 (s1's part now s2's). Blind pass: 16 of 22 choice
//   items were ≥ 50 % and right. s1 dropped (a set phrase fills its own gap); s2 is new.
import type { Clip } from '../types.ts';

export const donnaBully: Clip = {
  id: 'donnabully', video: '50d2x7j2dZ4', title: 'Donna uncovers her anonymous bully', dur: 256, wpm: 155,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 + §9.4, 55 % blind: the title says "anonymous bully", and the key was the only secret choice. All
    //   three are now unsigned complaints, so where she leaves them decides. Stem reworded; reveals drops "advice".
    // why: notes on her desk ← "Donna's desk" from the landmine plan (a keyword trap); texts ← Donna reads it on her
    //   phone
    { id: 'g1', skill: 'gist', level: 'B2', point: 'indirect', reveals: ['anon'], seg: [6.0, 57.0],
      stem: 'At the start, how does Donna’s boss deal with her problem with Donna?',
      choices: ['She posts unsigned complaints online', 'She leaves unsigned notes on Donna’s desk',
                'She sends Donna unsigned texts'], a: 0,
      cue: '助言のあと、カメラに向かって何をしたと言うか。',
      said: '注意するよう助言されたのに、本人には言わず、名前を隠してネットに書き込む。',
      mean: '面と向かって言えないことを、匿名の悪口で伝えようとしている。',
      trap: '机や携帯の話も出るので、そちらに引かれやすい。書いた場所は online と Yelp で決まる。',
      use: 'Can we talk about this face to face?（直接話せる？）' },

    // why: late ← a near meaning for a work problem; mess ← "desk" is the thing she wants to blow up
    { id: 'd1', skill: 'detail', level: 'B1', point: 'skip', seg: [6.2, 11.6],
      stem: 'What is the lesson for Donna supposed to be about?',
      choices: ['What happens when you skip work', 'What happens when you come in late',
                'What happens when your desk is a mess'], a: 0,
      cue: '「what happens when you」のあとの動詞。',
      line: 'teach her a lesson about *what happens when you skip work*.',
      said: '「仕事をサボるとどうなるか、教えてやりたい」と言う。',
      mean: 'skip work ＝ 仕事を休む、サボる。机を爆破するのは、そのための大げさな案。',
      trap: 'desk が直前に聞こえるので机の話に引かれやすい。when you のあとの動詞を待つ。',
      use: 'Let’s not skip class today.（今日は授業をサボらないでおこう）' },

    // R fix: V2, 70 % blind: "wait" and "a note" weren't ways of telling her. All three are now "Tell Donna …", so
    //   the manner decides.
    // why: kindly ← "mature" heard as gentle; in writing ← "firm" heard as formal, like a written warning
    { id: 'd3', skill: 'detail', level: 'B1', point: 'advice', seg: [18.6, 25.4],
      stem: 'What does Ron tell her to do?',
      choices: ['Tell Donna face to face what she needs', 'Tell Donna kindly, so she isn’t hurt',
                'Tell Donna in writing, to keep it formal'], a: 0,
      cue: '「look her in the eyes」のあと。',
      line: '*Look her in the eyes and tell her* exactly what you need from her. Be mature, direct, and firm.',
      said: '「目を見て、何をしてほしいかはっきり言え。大人らしく、率直に、きっぱりと」と助言する。',
      mean: '遠回しにせず、本人に直接言え、という助言。後の展開の前ふり。',
      trap: 'mature を「優しく」と取りやすい。最初の動詞で決まる。',
      use: 'Just tell him straight.（彼にはっきり言えばいいよ）' },

    // R fix: V2, 75 % blind: "shoved her in the hallway" didn't fit a phone. All three are now things done online.
    // why: reported ← "on Yelp" heard as an official complaint; photo ← slam = バタン, a sudden hit, read as a cheap shot
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'slammed', seg: [26.0, 29.2],
      stem: 'When Donna looks at her phone, what has someone done to her?',
      choices: ['Criticized her harshly online', 'Reported her to the city online',
                'Posted a bad photo of her online'], a: 0,
      cue: '「just」のあとの動詞と、そのあとのサイト名。',
      line: 'Some fool just *slammed me on Yelp*.',
      said: '「どこかのバカが、Yelp で私をこき下ろした」と言う。',
      mean: 'slam ＝ 激しく批判する。Yelp は店などの口コミサイト。',
      trap: 'slam は「バタンと閉める・叩きつける」の印象が強い。on のあとがサイトなら言葉の攻撃。',
      use: 'The critics slammed the movie.（批評家はその映画を酷評した）' },

    // R fix: V2, 55 % blind: the key was the only ironic, two-part choice ("while doing the opposite"). The choices
    //   are now one clause each.
    // why: too scared ← "I took Ron's advice" heard as the start of a confession that she couldn't; blames ← a talking
    //   head about someone's advice often blames them
    { id: 'h1', skill: 'humor', level: 'C1', point: 'anon', reveals: ['advice'], seg: [29.15, 36.6],
      stem: 'Why is her comment to the camera about Ron’s advice funny?',
      choices: ['She calls the opposite of his advice mature', 'She admits she was too scared to follow it',
                'She blames Ron for the way it turned out'], a: 0,
      cue: 'ほめ言葉のような副詞と、実際にしたこと。',
      line: 'I took Ron’s advice. I *very maturely and straightforwardly* left *anonymous comments*…',
      said: '「助言どおり、とても大人らしく率直に、名前を隠してネットに書き込んだ」と話す。',
      mean: '率直とは正反対の匿名の悪口を、助言どおりだと言い張るのがおかしい。',
      trap: '最初の一文で、助言を守った話だと思いやすい。ほめ言葉と行動が合っているかを確かめる。',
      use: 'I handled it like a total grown-up.（完全に大人の対応をしたよ）' },

    // R fix: V2, 55 % blind: "wasn't there" matched the skip-work set-up. Both distractors are now about the dog,
    //   from “adopt a dog”. reveals "nowhere" goes with s1.
    // why: no dogs left ← "nowhere to be found" heard as about the dog; someone else ← "adopt" heard as the request
    //   that failed
    { id: 'd4', skill: 'detail', level: 'B1', point: 'review', seg: [36.3, 41.95],
      stem: 'What does the review say went wrong at the shelter?',
      choices: ['Donna wasn’t there to help', 'Donna had no dogs left to adopt', 'Donna gave the dog to someone else'], a: 0,
      cue: '「but the employee」のあと。',
      line: 'Stopped by to adopt a dog, but the employee, Donna Meagle, was *nowhere to be found*.',
      said: '「犬を引き取りに来たのに、職員のドナはどこにもいなかった」と書いてある。',
      mean: 'nowhere to be found ＝ どこにも見当たらない。つまり持ち場にいなかった。',
      trap: 'adopt a dog から犬の話と思いやすい。but のあとが本当の不満。',
      use: 'The waiter was nowhere to be found.（店員がどこにも見当たらなかった）' },

    // R drop: s1, V2 at heart (70 % blind): "nowhere to be found" is a set phrase, so the gap fills itself. s2
    //   replaces it.
    // R new: s2, a sound item on "have to" (hafta), 47.6–50.6 s; both sources: "just have to work harder, I guess, huh?"
    //   Blind re-read ~40 %: all three fit "I guess". The speaker isn't asked.
    // why: had to ← the final f/v of "have" lost, heard as a past "d"; got to ← "gotta", the other common reduction
    { id: 's2', skill: 'sound', level: 'B2', point: 'haveto', seg: [47.6, 50.6],
      stem: 'Fill the gap: “Just ___ work harder, I guess, huh?”',
      choices: ['have to', 'had to', 'got to'], a: 0,
      cue: 'Just のすぐあと、work の前の短い2語。',
      line: 'Just *have to* work harder, I guess, huh?',
      said: '「もっと頑張るしかないね」と言う。have to は「ハフタ」に近く、v が f になる。',
      mean: '口コミを書いた本人が、知らないふりで同情してみせる一言。',
      trap: 'had to なら過去の話。have の f の音と、続く work が今の話だと示す。',
      use: 'I just have to try harder.（もっと頑張るしかない）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'hunt', seg: [53.3, 56.8],
      stem: 'Type what Donna says: “I’m about to ___.” (3 words)', answer: 'hunt you down',
      cue: '「about to」のあと。t と you がつながる。',
      line: 'I’m about to *hunt you down*.',
      said: '「今からお前を見つけ出してやる」と言う。hunt you は「ハンチュー」に近い。',
      mean: 'hunt down ＝ 追いつめて見つけ出す。about to ＝ 今にも～する。',
      trap: 't と y がつながって別の語に聞こえやすい。語末の t は次の音と混ざる。',
      use: 'I’ll track down that recipe.（あのレシピ、探し出すよ）' },

    // R fix: V2, 70 % blind: "relieved" was a filler. Two choices are now angry, so what she means to do decides;
    //   "not worth her time" is the boss's own reply a second later.
    // why: not worth it ← "who cares, really? Ignore it" (69.4 s) put in her mouth; afraid ← "hell no" heard as fear
    //   (no = いや、怖い)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'building', seg: [62.0, 69.5],
      stem: 'How does Donna react when she hears where the review came from?',
      choices: ['Angry, and set on finding the writer', 'Angry, but sure it isn’t worth her time',
                'Shocked, and afraid to face the person'], a: 0,
      cue: '場所を聞き返したあとの短い一言。',
      line: 'someone inside City Hall. — In this building? *Oh, hell no!*',
      said: '「市役所の中の誰か」と聞いて、「この建物？ ありえない！」と叫ぶ。',
      mean: 'Oh, hell no! は強い怒りの「絶対に許さない」。すぐあとで追いつめる気になっている。',
      trap: 'no を「怖い・いやだ」と取りやすい。そのあとの言葉が攻める内容なら怒り。',
      use: 'Cut in line? Oh, heck no.（割り込み？冗談じゃない）' },

    // R fix: V2, 80 % blind: "calm down" contradicted the hammer in the stem. "Take down" (a near phrasal verb)
    //   replaces it.
    // why: go down ← "come down" read literally, as going downstairs; taken down ← "down" heard as removing the
    //   review
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'hammer', seg: [73.6, 77.1],
      stem: 'When Donna mentions Thor’s hammer, what does she plan to do?',
      choices: ['Punish the writer very hard', 'Go down to the writer’s floor', 'Get the writer’s review taken down'], a: 0,
      cue: '「come down」のあとの on と、何に例えるか。',
      line: 'I’m about to *come down on this dude* like Thor’s hammer.',
      said: '「トールのハンマーみたいに、この男をたたきのめす」と言う。',
      mean: 'come down on ~ ＝ ～を厳しく罰する、たたく。ハンマーの例えで強さを足している。',
      trap: 'come down を「降りる」と取りやすい。on + 人なら「厳しく当たる」。',
      use: 'My boss came down hard on me.（上司にきつく叱られた）' },

    // R fix: V2 + K6, 50 % blind: "completely" was an absolute only in a distractor. "Hints he wrote the review"
    //   (the wrong implication of a talking head right after the Yelp story) replaces "warns".
    // why: wrote it ← "Speaking of bad reviews" right after the review, as a confession; new topic ← a talking head
    //   often starts fresh
    { id: 'm1', skill: 'marker', level: 'B2', point: 'speaking', seg: [81.4, 90.9],
      stem: 'What does Ron’s first phrase to the camera do?',
      choices: ['Links his news to the bad review', 'Hints he wrote the bad review himself',
                'Signals a change to a new topic'], a: 0,
      cue: '最初の2語と、そのあとの名詞。',
      line: '*Speaking of bad reviews*, computers are mostly pointless, but that Yelp thing gave me a great idea…',
      said: '「悪い口コミと言えば」と始め、Yelp から批判のいい案を思いついたと話す。',
      mean: 'Speaking of ~ ＝「～と言えば」。前の話題から自分の話に入る合図。',
      trap: '話し手が変わると別の話に聞こえやすい。Speaking of のあとは前の話題の言葉。',
      use: 'Speaking of food, are you hungry?（食べ物と言えば、お腹すいた？）' },

    // R fix: V2, 65 % blind: crunchy and green were literal fillers. The distractors are now a sincerity flip and a
    //   degree shift, both about it as a dessert.
    // why: secretly likes ← "you are the celery of desserts" heard as a fond nickname; worst-tasting ← "zero stars"
    //   heard as a taste verdict, not a copy of ice cream
    { id: 'h2', skill: 'humor', level: 'C1', point: 'celery', seg: [110.3, 118.0],
      stem: 'In Ron’s letter, what does comparing frozen yogurt to celery say?',
      choices: ['It’s a dull, healthy copy of real dessert', 'It’s a healthy dessert he secretly likes',
                'It’s the worst-tasting dessert of all'], a: 0,
      cue: '例えのすぐあとの「be ~ or be ~」。',
      line: 'you are *the celery of desserts*. *Be ice cream or be nothing*.',
      said: '「お前はデザート界のセロリだ。アイスクリームになるか、無になれ」と書く。',
      mean: 'セロリはダイエット用の味気ない野菜。本物のアイスのまねをした中途半端なもの、という悪口。',
      trap: '「味が最悪」や愛称に取りやすい。すぐあとの「アイスになれ」が、何のまねかを示す。',
      use: 'Decaf is the celery of coffee.（カフェインレスはコーヒー界のセロリだ）' },

    // R fix: V2, 50 % blind: the key alone echoed the review's "adopt". Two choices are now about the adoption.
    // why: kept waiting ← "last week" heard as a delay; fired ← "You're fired" comes right after (a keyword trap)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'grudge', seg: [123.65, 132.6],
      stem: 'Why does Donna think this man wrote the review?',
      choices: ['She had refused to let him adopt', 'She kept him waiting to adopt a cat',
                'He had been fired from her office'], a: 0,
      cue: '「last week」の出来事と、そのあとの Then。',
      line: 'You tried to *adopt a cat* last week and I *turned you down*… *Then* you tried to blow up my spot online.',
      said: '「先週、猫を引き取ろうとしたのを断った。そのあと、ネットで私を攻撃した」と言う。',
      mean: '断られた仕返しに書いたはず、と Then でつないで理由にしている。',
      trap: 'fired が直後に聞こえ、首の話に引かれやすい。Then の前が理由。',
      use: 'You’re still mad about last week?（まだ先週のことで怒ってるの？）' },

    // why: sixteen / sixty ← -teen/-ty against the short "six"
    { id: 'n1', skill: 'number', level: 'B1', point: 'cats', seg: [126.3, 129.75],
      stem: 'How many cats does Donna say he already has?',
      choices: ['six', 'sixteen', 'sixty'], a: 0, keep: true,
      cue: '「too sad for you to have」のあと。',
      line: 'it was too sad for you to have *six cats*.',
      said: '「猫6匹は悲しすぎると思った」と言う。',
      mean: '6匹目を断った理由。これがこの男への疑いにつながる。',
      trap: '-teen や -ty が付くと語が長くなる。six は短く、すぐ cats が続く。',
      use: 'Six is plenty, thanks.（6つで十分です）' },

    // R fix: V2, 55 % blind: "blow up her desk" was the landmine plan, not something done online. All three are now
    //   "Trying to …", and two read "spot" as a place.
    // why: take her place ← spot = 持ち場, read literally; where she lives ← spot = 場所, read literally
    { id: 'p3', skill: 'phrase', level: 'C1', point: 'spot', seg: [128.85, 131.95],
      stem: 'What does Donna accuse him of doing online?',
      choices: ['Trying to make her look bad', 'Trying to take her place at work', 'Trying to find out where she lives'], a: 0,
      cue: '「online」の前の動詞と、spot の組み合わせ。',
      line: 'Then you tried to *blow up my spot* online.',
      said: '「そのあとネットで私の評判をつぶそうとした」と言う。',
      mean: 'blow up someone’s spot は「人前で恥をかかせる」のくだけた形。',
      trap: 'spot を「場所」と取りやすい。online なら評判をつぶす話。',
      use: 'Don’t put me on the spot.（人前で困らせないで）' },

    // why: didn't hear ← the repeat heard as not catching his reply; adoption list ← "fired" heard in a narrower sense,
    //   since the cat request was the topic
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'fired', seg: [131.8, 138.5],
      stem: 'After he says she isn’t his boss, what does Donna’s answer show?',
      choices: ['She doesn’t care whether she can fire him', 'She didn’t catch what he had just said',
                'She means he’s banned from adopting pets'], a: 0,
      cue: '彼の反論のあと、同じ言葉がもう一度。',
      line: 'You’re not my boss. I work for the city attorney’s office. — *You’re fired.*',
      said: '「あんたは上司じゃない、別の部署だ」と言われても、同じ「クビ」をくり返す。',
      mean: '理屈は聞く気がない。権限がなくても言い切る、という強い態度。',
      trap: 'くり返しは聞こえなかったからにも見える。相手の理屈のあとに同じ言葉なら、無視の合図。',
      use: 'I don’t care. Still no.（関係ない。それでもダメ）' },

    // why: unfinished ← "It says" heard as a draft; friendly ← "Dear… you" heard as a casual hello ("hey, you")
    // anchor: 141.5–144.4 s he asks the postage, so the letter is ready to go; 144.4–147.8 s "Who's it going to? —
    //   Canada. — It says, 'Dear Canada, you.'": his letters are "strongly worded… about things I disapprove of"
    //   (91.7–95.8 s), and the one before ran "Dear frozen yogurt, you are…" (110.5–113.6 s)
    // R fix: V2, 75 % blind: "a friendly hello" was absurd for Ron's letters. "Too angry to finish" (the right
    //   feeling, read as an outburst, not a choice) replaces it; "unfinished" now says when he'd finish.
    // why (new): too angry ← the scorn heard, but as losing control; finish once he knows ← the postage question heard
    //   as a step before writing the rest
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'canada', seg: [140.5, 149.4],
      stem: 'Why does the letter that reads “Dear Canada, you.” get a laugh?',
      choices: ['The lone “you” says all his contempt', 'He was too angry to finish the line',
                'He’ll finish it once he knows the cost'], a: 0,
      cue: '切手代を聞いていることと、you のあとに何もないこと。',
      line: 'How much *postage* … to Canada? — Who’s it going to? — *Canada*. — It says, “*Dear Canada, you.*”',
      said: 'カナダ宛ての切手代を聞き、宛先は国そのもの、手紙は「親愛なるカナダ、お前」だけだと言う。',
      mean: '「お前は～だ」の悪口の型から、悪口を抜いて you だけ残す。言うまでもない軽蔑、という笑い。',
      trap: '怒りすぎて書けなかったと取りやすい。落ち着いて切手代を聞く、完成品。型の残りを想像して聞く。',
      use: 'Dear Monday: you.（月曜日へ。お前な）' },

    // why: visit ← "where to find me" turned around, as him going to find them; worried ← "know where to find me" heard
    //   as a fear of being tracked down (scope flip: he means a dare)
    // anchor: 186.6–190.1 s "if you believe in something, you sign your name to it"; 190.3–195.0 s "Which is why the
    //   makers of carbonated water will soon know exactly where to find me": the name and address on his letters
    //   (174.3–178.3 s)
    // R fix: V2, 50 % blind: "worried" contradicted his "made of glass" bravado. "Track him down online" (the
    //   IP search earlier, a keyword trap) replaces it.
    // why (new): track him down online ← Donna's IP search, as how they'd "find" him
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'soda', seg: [184.3, 195.6],
      stem: 'What is Ron leaving unsaid about the makers of carbonated water?',
      choices: ['He has signed and sent them an angry letter', 'He is about to go and protest in person',
                'He expects them to track him down online'], a: 0,
      cue: '「Which is why」が、直前の何を受けているか。',
      line: 'if you believe in something, *you sign your name to it*. *Which is why* the makers of carbonated water will soon *know exactly where to find me*.',
      said: '「信じるなら名前を書け。だから炭酸水の会社は、もうすぐ私の居場所を知る」と言う。',
      mean: 'Which is why が前の「名前を書く」を受ける。署名入りの抗議文を送った、と言わずに伝える。',
      trap: '居場所を「探される」話と取りやすい。which is why は前の「名前を書く」が理由。',
      use: 'Which is why I brought snacks.（だからお菓子を持ってきたの）' },

    // R fix: V2, 55 % blind: the key was the only one about feelings. "Keep their feelings out of work" (the
    //   usual boss-and-friend deal, and the key's opposite) replaces "work and friendship".
    // why: feelings out ← a usual workplace deal; job back ← he was fired wrongly, so a fix is expected
    { id: 'g2', skill: 'gist', level: 'B1', point: 'blunt', seg: [198.0, 235.3],
      stem: 'What do Donna and her boss agree on at the end?',
      choices: ['To tell each other what they feel', 'To keep their feelings out of work',
                'To get the fired man his job back'], a: 0,
      cue: '「From now on」のあと。',
      said: '上司が告白し、お互いに謝って、これからは思ったことをそのまま言おうと決める。',
      mean: '遠回しの悪口で始まった話が、直接言い合う約束で終わる。',
      trap: 'クビになった人の話が出るので、その後始末に思いやすい。From now on のあとが約束。',
      use: 'From now on, just tell me.（これからは、ただ言ってね）' },

    // R fix: V2, 55 % blind: the key alone named the evidence the stem hints at ("work out"). It no longer says
    //   "sounded like her boss", and all three name a source.
    // why: address ← the earlier IP search, as the proof; Kyle ← he's the one who was fired
    { id: 'i2', skill: 'infer', level: 'C1', point: 'funeral', seg: [203.4, 210.3],
      stem: 'How did Donna work out who really wrote the review?',
      choices: ['Another of the user’s reviews gave her away', 'The user’s address led right to her desk',
                'Kyle told her he had never written it'], a: 0,
      cue: '「I checked」のあと、もう一つの口コミの中身。',
      line: 'I checked what else that user had written. It was a review of a *funeral home* that said, “*Great first date spot*.”',
      said: '「その人の別の口コミは、葬儀場に『初デートにぴったり』だった」と言う。',
      mean: 'そんな暗い冗談を書くのは上司しかいない、と分かった。名前を言わずに伝えている。',
      trap: '前に住所を調べた場面があるので、その結果だと思いやすい。I checked のあとが根拠。',
      use: 'I checked his other posts.（彼のほかの投稿を見てみた）' },

    // R fix: V2, 70 % blind: "admit" was the obvious end of a whodunit. The distractors are now two other ways to
    //   "clean" things up.
    // why: take it down ← "come clean" heard as cleaning up the review; desk ← "clean" read literally, and the
    //   landmine plan was about her desk
    { id: 'p4', skill: 'phrase', level: 'B2', point: 'clean', seg: [206.85, 212.55],
      stem: 'What was Donna waiting for her boss to do?',
      choices: ['Tell the truth without being pushed', 'Take the review down by herself',
                'Clean up her own desk at last'], a: 0,
      cue: '「to see if you would」のあと。',
      line: '…to see if *you would come clean*.',
      said: '「自分から白状するか見たかった」と言う。',
      mean: 'come clean ＝ 隠していたことを正直に打ち明ける。',
      trap: 'clean を「掃除」と取りやすい。come clean は人が主語で「白状する」。',
      use: 'Just come clean. It’s easier.（正直に言いなよ。その方が楽だよ）' },

    // why: felt bad for Kyle ← confessing right after he's fired looks like saving him (sincerity flip); only because
    //   caught ← the confession follows Donna's trick, as if she knew she'd been found out
    // anchor: 202.8–205.2 s "I know. — You do?" (she didn't know she was found out); 212.6–222.1 s "you overestimated how
    //   much I care what happens to Kyle… or anyone, really. But I'm sorry that I didn't just talk to you."
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'care', seg: [212.55, 221.58],
      stem: 'What does her boss’s answer say about why she confessed?',
      choices: ['Not for Kyle; she wanted to set things right', 'For Kyle; she felt bad that he got fired',
                'Only because she knew Donna had caught her'], a: 0,
      cue: 'Kyle の話のあとの「But」に続く謝罪。',
      line: 'you *overestimated how much I care* what happens to Kyle. Or anyone, really. *But I’m sorry* that I didn’t just talk to you.',
      said: '「Kyle も誰も気にしてない」と言ってから、「でも直接話さなくてごめん」と謝る。',
      mean: '告白は Kyle を救うためではないと打ち消し、but のあとで本当の理由、ドナとの関係を出す。',
      trap: 'クビの直後なので同情の告白に見えやすい。直前の You do? から、ばれたとも知らなかった。',
      use: 'Not for him. For us.（彼のためじゃない。私たちのため）' },

    // why: what she'd like ← "want to" read literally, as a guess at her wish; agreeing ← the deal to be honest, as if
    //   this were playing along
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'wantto', seg: [230.5, 234.2],
      stem: 'After the remark about lipstick, what is the reply?',
      choices: ['A threat, worded as friendly advice', 'A guess at what the other would like',
                'A joke that goes along with the deal'], a: 0,
      cue: '「want to」のあとの動詞。',
      line: '*You’re gonna want to* shut your mouth right now.',
      said: '口紅が変だと言われ「今すぐ黙った方が身のためだよ」と返す。',
      mean: 'You’re gonna want to ~ は助言の形の命令。ここは「黙らないと許さない」。',
      trap: 'want を「～したい」と取ると相手の希望の話に聞こえる。あとが命令の動詞なら強い指示。',
      use: 'You’re gonna want to see this.（これは見ておいた方がいいよ）' },
  ]
};
