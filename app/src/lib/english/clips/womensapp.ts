// “Women's Appreciation - The Office US” (the official The Office channel, Best of Season 3): Dwight's memo of rules
// for the women angers them, and Michael calls a "women's appreciation" meeting that keeps going wrong.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 251 s; whisper's repeated "in tune with
// the moon" after 263 s is a loop. Untested on purpose: the cleavage line (53 s), "slept with a woman" (85 s), the
// Oscar line (90 s; captions "ask her"), the 124–144 s bit, the haircut line (223–233 s), the R-E-S-P spelling (69 s;
// captions "RESP sweetie"), and who says "Then the fashion models…" (199 s; whisper "Yes, Andy", captions "yes indeed").
// REVIEW 2026-11-16: pass 14, fix 10, drop 0, new 0; ear checks 1
//   Open: this id is also in banks/SKIPPED.txt (sexual punchlines, flashing backstory). The bank routes around those
//   stretches and the reviewer judged it passes C1, but one of the two has to go: the SKIPPED line or this file.
//   Open: d2 and nt2 rest on the period exchange, which the SKIPPED reason cites; drop them if that's out of bounds.
// EAR CHECK: 234.6 s d2 nt2 — whisper “you always ask us if we're on our periods”, captions “ask us to form in our
//   periods” (the shown line; both keys rest on “I have to know whether you're serious or not”, which both have)
import type { Clip } from '../types.ts';

export const womensAppreciation: Clip = {
  id: 'womensapp', video: '2ap7aEaPics', title: 'Women’s Appreciation', dur: 273, wpm: 158, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 % and right): the key was the only memo of rules and the only two-part choice. Now all
    //   three are two-part memos, and only the read-out rules settle it.
    // why: sent home early ← "Women will be sent home…" is the memo's first line, heard as the news itself; phones ←
    //   "I don't feel like answering phones" in the opening lines, heard as a new duty
    { id: 'g1', skill: 'gist', level: 'B1', point: 'memo', seg: [0, 39],
      stem: 'At the start, what are the women upset about?',
      choices: ['A memo limiting what women wear and who they talk to',
                'A memo making women answer the phones and take notes',
                'A memo sending women home early and cutting their pay'], a: 0,
      cue: '最初に読み上げられる文書の中身。',
      line: '…this *memo* that Dwight sent out? “Women will be sent home if they wear *makeup*…”',
      said: 'ドワイトのメモには、化粧、ヒール、服、話し相手まで、女性だけへの決まりが並ぶ。',
      mean: '女性たちは「ばかげている」「侮辱だ」と反発している。',
      trap: 'sent home や電話の語も聞こえるが、前者は決まりの罰、後者は脇の一言。続く条件まで聞く。',
      use: 'Did you see the new memo?（新しいお知らせ見た？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'guyssee', seg: [7.2, 10.55],
      stem: 'Type the start of the question: “___ this memo that Dwight sent out?” (4 words)',
      answer: 'did you guys see',
      cue: '場面が変わってすぐ、最初の短い質問。',
      line: '…*did you guys see* this memo that Dwight sent out?',
      said: '「ドワイトが出したこのメモ見た？」と仲間に聞く。did you は「ディジュ」とつながる。',
      mean: 'you guys は男女を問わず「みんな」。仲間への呼びかけの定番。',
      trap: 'did と you がつながり、you が消えたように聞こえる。',
      use: 'Did you guys see the game last night?（みんな昨日の試合見た？）' },

    // why: one-half ← "one-quarter" heard only as "a fraction"; three-quarters ← "quarter" caught, "one" lost; one inch
    //   ← "inch" is the last word heard
    { id: 'n1', skill: 'number', level: 'B1', point: 'heels', seg: [10.1, 18.1],
      stem: 'By the memo, women are sent home for heels higher than what?',
      choices: ['One-quarter inch', 'One-half inch', 'Three-quarters of an inch', 'One inch'], a: 0, keep: true,
      cue: '「heels exceeding」のあとの長さ。',
      line: '…makeup or heels exceeding *one-quarter inch*.',
      said: '「化粧や、4分の1インチを超えるヒールなら帰宅させる」と読み上げる。',
      mean: '約6ミリ。ほとんど平らな靴しか許さない、極端に厳しい決まり。',
      trap: 'quarter だけ聞くと3/4と迷う。分数は最初の one か three をしっかり聞く。',
      use: 'It’s about a quarter mile from here.（ここから400メートルくらい）' },

    // why: spoken ← "authorization" caught without the short "written" before it; a male coworker ← the usual
    //   chaperone script for such a rule
    { id: 'd1', skill: 'detail', level: 'B1', point: 'strangers', seg: [15.5, 22.2],
      stem: 'By the memo, what do women need before speaking to strangers?',
      choices: ['Written permission from Dwight', 'Spoken permission from Dwight', 'A male coworker beside them'], a: 0,
      cue: '「strangers」のすぐあと、条件の部分。',
      line: 'Females are not allowed to speak to strangers *unless given written authorization* by Dwight Schrute.',
      said: '「ドワイトの書面の許可なしに、女性は知らない人と話せない」と読む。',
      mean: 'unless ＝ 〜でない限り。authorization ＝ 許可。',
      trap: 'authorization だけだと口頭の許可と取りやすい。前の短い written を聞く。',
      use: 'No entry unless you have a ticket.（チケットがない方は入れません）' },

    // R fix: V2 (blind 50 % and right): "hard to accept too" was a filler. The new distractor hangs "desperate" on
    //   the women, the wrong relation.
    // why: short time ← "desperate times" read as "for a time" (一時的); make them desperate ← "desperate" heard as
    //   what the rules do to the women
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'measures', seg: [25.9, 32.95],
      stem: 'When told his memo is insulting, what does Dwight mean by his reply?',
      choices: ['A crisis like this calls for strict rules', 'The rules are only for a short time',
                'Strict rules will make the women desperate'], a: 0,
      cue: '「insulting」と言われた直後の決まり文句。',
      line: '*Desperate times call for desperate measures.*',
      said: '「非常時には非常手段が必要だ」と、決まり文句で言い返す。',
      mean: '状況が深刻だから厳しい対策も仕方ない、という言い訳。謝る気はない。',
      trap: 'times を「一時的」、desperate を女性たちの状態と取りやすい。決まり文句はひとかたまりで覚える。',
      use: 'Desperate times call for instant noodles.（非常時にはカップ麺だ）' },

    // why: like the men's ← "button-up collars" sounds like men's shirts; cold weather ← "sleeves down to the wrists"
    //   heard as winter wear
    { id: 'i1', skill: 'infer', level: 'B2', point: 'nobody', seg: [32.6, 38.2],
      stem: 'After the clothing rules are read out, what point is made?',
      choices: ['The rules ask for clothes no one wears', 'The rules ask for clothes like the men’s',
                'The rules ask for clothes for cold weather'], a: 0,
      cue: '服の決まりを並べたあとの短い一言。',
      line: 'Sleeves down to the wrists, button-up collars, and muted colors. *Nobody dresses like that.*',
      said: '袖は手首まで、襟は上まで、地味な色、と読み、「そんな服の人はいない」と言う。',
      mean: '決まりが現実離れしていて、守りようがないという反論。',
      trap: '袖や襟から季節や男性の服を想像しやすい。最後の Nobody の一言が言いたいこと。',
      use: 'Nobody talks like that anymore.（今どきそんな話し方しないよ）' },

    // why: harder ← "Why don't you just…" taken as a real suggestion (literal); a joke to ignore ← the image is so wild
    //   it sounds like teasing, not an accusation
    { id: 'i2', skill: 'infer', level: 'C1', point: 'sack', seg: [38.15, 47.85],
      stem: 'What is Michael telling Dwight with the burlap sack line?',
      choices: ['His rules hurt the women as much as a beating', 'He should be even harder on the women than this',
                'His rules are a joke the women can just ignore'], a: 0,
      cue: '最後の「Because…」で何を言い切るか。',
      line: '…put them in a *burlap sack*, and hit them with a stick? *Because that’s what you’re doing.*',
      said: '「袋に入れて棒でたたけばいい。君がしているのはそういうことだ」と言う。',
      mean: 'わざと大げさな例えで、決まりがそれほどひどいと責めている。本気の提案ではない。',
      trap: '前半を提案と取りやすい。最後の that’s what you’re doing が本音。',
      use: 'You might as well just lock us in.（いっそ閉じ込めればいいのに）' },

    // R fix: V2/K4 (blind 60 % and right): "Why do you just take…" barely fits, so "just" pointed at "don't". Now
    //   three negatives that all fit the gap.
    // why: didn't ← "don't" and "didn't" both lose the t, and a "why didn't you" complaint fits; won't ← "don't" and
    //   "won't" share the vowel
    { id: 's1', skill: 'sound', level: 'B2', point: 'whydont', seg: [41.9, 46.65],
      stem: 'Fill the gap: “___ just take these women…”',
      choices: ['Why don’t you', 'Why didn’t you', 'Why won’t you'], a: 0,
      cue: '「terrorists」のすぐあと、文頭の速い3語。',
      line: '*Why don’t you* just take these women…',
      said: '「いっそこの女性たちを…」と言う。Why don’t you が「ワイドンチュ」とつながる。',
      mean: 'いっそ〜したら、という皮肉の前置き。',
      trap: 'n’t の t はどれも消えやすい。didn’t なら「ディドゥン」と二拍、won’t は w で始まる。',
      use: 'Why don’t you just call her?（いっそ電話してみたら？）' },

    // why: back him up ← Dwight against the women, so the question sounds like a call for support; over the noise ←
    //   "Did you hear that?" taken literally (聞こえた？)
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'hear', seg: [57, 67.45],
      stem: 'When Dwight asks Michael the same question back, what is he doing?',
      choices: ['Hinting that Michael needs the lesson too', 'Asking Michael to back him up against her',
                'Checking that Michael heard over the noise'], a: 0,
      cue: '名前だけ入れかえた、同じ形の質問。',
      line: 'Did you hear that, Dwight? — Yes. *Did you hear that, Michael?* — No, Dwight.',
      said: '「聞いたか、ドワイト」に、ドワイトは「はい。聞きましたか、マイケル」と返す。',
      mean: '同じ言葉を返して「あなたこそ」とほのめかす。マイケルは No で受け流す。',
      trap: 'hear を「聞こえる」と文字通り取りやすい。同じ形の返しは、相手に向け返す合図。',
      use: 'Right back at you.（そっくりそのまま返すよ）' },

    // why: fifteen ← "five" heard with a -teen; ten ← the round number for a meeting; two ← "room" and "minutes" rush
    //   past the number
    { id: 'n2', skill: 'number', level: 'B1', point: 'minutes', seg: [72.9, 78.55],
      stem: 'When does Michael want everyone in the conference room?',
      choices: ['In two minutes', 'In five minutes', 'In ten minutes', 'In fifteen minutes'], a: 1, keep: true,
      cue: '「conference room」のすぐあと。',
      line: '*Conference room. Five minutes.* Women’s appreciation.',
      said: '「会議室、5分後。女性に感謝する会だ」と短く告げる。',
      mean: '名詞だけを並べた、上司らしい短い指示。「5分後に会議室に集合」。',
      trap: 'five と fifteen は長さが違う。-teen なら後ろが長く強くなる。',
      use: 'Lobby, ten minutes. Don’t be late.（ロビーに10分後。遅れないで）' },

    // R fix: V2 (blind 55 % and right): "offering to help" was a filler. The item also leant on "Wait a second",
    //   where the sources differ; it now rests on the question and Michael's reply, which both have, so the ear
    //   check is gone.
    // why: training ← the question taken at face value (資格を聞いている); what it is ← "for that" heard as asking
    //   about the meeting itself
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'challenge', seg: [78.55, 83.25],
      stem: 'When someone asks how Michael is qualified, what is the question doing?',
      choices: ['Suggesting he is the wrong one to lead it', 'Asking what training Michael has had for it',
                'Asking Michael to explain what it is for'], a: 0,
      cue: '質問の中身と、マイケルの返し方。',
      line: 'How are you *qualified* for that? — *Oh, I don’t know, James.*',
      said: '「それをやる資格があるの？」に、マイケルは「さあね、ジェームズ」と皮肉で返す。',
      mean: '答えを求める質問ではなく、「あなたがやるのは変だ」という疑い。',
      trap: '疑問文はつい情報を聞いていると取る。資格を問う質問は異議のことが多く、返事も皮肉になる。',
      use: 'Hold on. Who decided that?（ちょっと待って、誰が決めたの？）' },

    // why: knows nothing ← "Oh, I don't know" taken literally as an admission; his mom ← "came from a woman" heard as
    //   closeness to his mother
    { id: 'h1', skill: 'humor', level: 'C1', point: 'woman', seg: [78.55, 84.55],
      stem: 'Why does Michael’s first proof that he’s qualified get a laugh?',
      choices: ['It’s true of everyone, so it proves nothing', 'He admits he knows nothing about women',
                'He is boasting about being close to his mom'], a: 0,
      cue: '「I don’t know」のあとに出す理由の中身。',
      line: 'Oh, I don’t know, James. *Did I come from a woman?*',
      said: '「さあね。僕は女性から生まれたかな？」と、資格の証拠として言う。',
      mean: '誰でも母親から生まれる。全員に当てはまることなので、何の証明にもならない。',
      trap: 'I don’t know を「知らない」と取りやすいが、ここは「言うまでもない」という皮肉。',
      use: 'Oh, I don’t know, maybe because it’s Monday?（さあね、月曜だからじゃない？）' },

    // why: upset ← "big deal" caught without "what is the"; lost ← "still discussing" heard as "what are we discussing"
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'bigdeal', seg: [108.8, 112.95],
      stem: 'Right after Michael’s apology, how does the next speaker feel?',
      choices: ['Impatient: it doesn’t seem a big deal', 'Upset: it seems a very big deal',
                'Lost: they missed what was discussed'], a: 0,
      cue: '質問のあと、「I say again」に続く言葉。',
      line: '*Are we still discussing this?* I say again, *what is the big deal?*',
      said: '「まだこの話？もう一度言うけど、何が問題なの？」と言う。',
      mean: 'still と I say again に、うんざりした気持ちが出ている。',
      trap: 'big deal だけ拾うと逆に取れる。What is the big deal? は「何をそんなに」。',
      use: 'Relax. What’s the big deal?（落ち着いて、何をそんなに）' },

    // R fix: V2 (blind 50 % and right): "relief" was weak. The new distractor is the kind, face-saving frame.
    // why: real shock ← "surprise" taken at face value; kindness ← the Japanese frame: a short reply that smooths
    //   over someone's lapse (気にしないで)
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'surprise', seg: [112.95, 122.7],
      stem: 'When Meredith says she doesn’t remember it, how is the reply meant?',
      choices: ['As a dig: of course she doesn’t remember', 'As real shock that she could forget it',
                'As kindness: anyone could forget that'], a: 0,
      cue: '覚えていないと言われた直後の、短い返し。',
      line: 'I don’t remember doing that. — *What a surprise.*',
      said: 'パーティーでの件を本人が「覚えてない」と言うと、相手は「それは驚きね」と返す。',
      mean: '本当は驚いていない。「どうせ覚えてないでしょ」という皮肉。',
      trap: 'surprise を文字通り「驚き」と取りやすい。当然のことに What a surprise は皮肉。',
      use: 'He’s late again? What a surprise.（また遅刻？意外だね（皮肉））' },

    // why: thank him ← Michael is the one who says "Thank you" (to the criticism); magazines ← Michael's own point,
    //   which no woman takes up
    { id: 'g2', skill: 'gist', level: 'B2', point: 'sexist', seg: [143.6, 238.85],
      stem: 'As Michael’s talk goes on, how do the women respond to it?',
      choices: ['They tell him what he says is sexist', 'They thank him for standing up for them',
                'They agree magazines are unfair to them'], a: 0,
      cue: '女性たちが口をはさむ場面の言葉。',
      said: 'マイケルは雑誌や社会の話をするが、女性たちは差別的だと言い返す。',
      mean: '女性を応援するはずの会が、マイケル自身の偏見を指摘される場になる。',
      trap: 'Thank you や magazines は聞こえるが、言っているのはマイケル。誰の言葉かを区別する。',
      use: 'With respect, that sounds a bit sexist.（失礼ながら、それは少し性差別的です）' },

    // R fix: V2 (blind 50 % and right): "look like the models" contradicted "No, they are not" outright, leaving
    //   the key as the only reading of it. The new distractor is the same defence in the opposite direction.
    // why: all goddesses ← "goddesses" + "look around" heard as praise, "not" lost; blames them ← "magazines"
    //   heard as something the women buy
    { id: 'h2', skill: 'humor', level: 'C1', point: 'lookaround', seg: [156.5, 170.5],
      stem: 'Why is Michael’s point about the magazines funny?',
      choices: ['Defending the women, he says they aren’t goddesses', 'Defending the women, he calls them all goddesses',
                'He blames the women for buying those magazines'], a: 0,
      cue: '「look around」のあと、自分で出す答え。',
      line: '…portray women as *skinny, tall goddesses*. Well, *look around*. Are women like that? *No, they are not.*',
      said: '「雑誌は女性を細い女神に描く。周りを見ろ。そうか？違う」と言う。',
      mean: '雑誌を責めるつもりで、目の前の女性たちを「女神ではない」と言ってしまっている。',
      trap: 'look around を「雑誌を見て」と取りやすい。自分で答える No が誰を指すかを聞く。',
      use: 'Look around. Does anyone here care?（周りを見て。誰か気にしてる？）' },

    // R fix: V2 (blind 50 % and right): "giving up hope" was weak. The new distractor reads "up" as being ahead.
    // why: fight back ← "against" read as 反対する; ahead ← "up" as in "we're up by two" (リードしている)
    { id: 'p3', skill: 'phrase', level: 'C1', point: 'against', seg: [175.1, 183.05],
      stem: 'What does Michael say the magazine images mean for the women?',
      choices: ['They face a hard and unfair fight', 'They should stand up and fight it',
                'They are ahead, and winning the fight'], a: 0,
      cue: '「So what does that say?」のあとの答え。',
      line: 'That says that you women are *up against it*. And it is criminal.',
      said: '「つまり君たち女性は苦しい立場にいる。それはひどいことだ」と言う。',
      mean: 'be up against it ＝ 不利な状況で、厳しい戦いを強いられている。',
      trap: 'against を「反対する」、up を「優勢」と取ると逆になる。これは苦しい状態の表現。',
      use: 'We’re really up against it this week.（今週は本当に厳しい）' },

    // C2 who is the joke on?
    // R fix: V2 (blind 55 % and right): "really" in the stem pointed away from the named target, and the key was the
    //   only analytic choice. "really" is gone, and all three are "X, for…".
    // why: society ← his anger sounds sincere, so the target he names looks like the target of the joke (sincerity
    //   flip); the women ← "you women are up against it" heard as blaming them
    // anchor: 177.2–184.4 s he tells the women they're "up against it" and blames society ("Society doesn't care"),
    //   then 185.9–188.8 s "I don't even consider myself a part of society": he steps out of the society he blames,
    //   just after telling them they aren't goddesses (h2, 156.5–170.5 s)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'society', reveals: ['lookaround'], seg: [175.1, 189.05],
      stem: 'In Michael’s rant about society, who is the joke on?',
      choices: ['Michael, for stepping out of the society he blames', 'Society, for treating women so unfairly',
                'The women, for caring what society thinks'], a: 0,
      cue: '直前の自分の発言と、社会から抜ける一言。',
      line: '…you women are up against it… Society sucks. *I don’t even consider myself a part of society.*',
      said: '女性の体型をあれこれ言った直後に社会を責め、「自分は社会の一員ではない」と言い切る。',
      mean: '偏見を口にしたその口で社会を責め、自分だけ外に出る。笑われているのはマイケル本人で、本人は気づいていない。',
      trap: '怒りが本気に聞こえるので社会が標的に思える。責める人が同じことをしていないかを聞く。',
      use: 'I hate gossip. Did you hear about Tom?（うわさ話は嫌い。トムの話聞いた？）' },

    // why: change it ← "Society doesn't care" heard as his cause; part of the problem ← "part of society" caught
    //   without "don't even consider"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'society', seg: [182.85, 189.05],
      stem: 'What does Michael say about himself and society?',
      choices: ['He doesn’t see himself as part of it', 'He has worked hard to try to change it',
                'He knows that he is part of the problem'], a: 0,
      cue: '「Society sucks」のあと、自分について。',
      line: 'Society doesn’t care. Society sucks. I *don’t even consider myself a part of* society.',
      said: '「社会は無関心で最悪。自分は社会の一員だとさえ思っていない」と言う。',
      mean: 'consider myself ＝ 自分を〜と思う。ここは否定。',
      trap: 'part of society だけだと「自分も一員」と逆になる。前の don’t even を聞く。',
      use: 'I don’t consider myself a morning person.（朝型だとは思ってない）' },

    // R fix: V2/K1 (blind 60 % and right): "glad a woman is finally speaking up" is half defensible given "proves my
    //   point. Women can do anything". It's replaced by the polite-acceptance frame, which his next words refute.
    // why: accepts it ← the Japanese frame ご指摘ありがとうございます: thanks for a criticism as graceful acceptance;
    //   mocking ← "That was not necessary" heard as cold politeness (慇懃無礼)
    { id: 'h3', skill: 'humor', level: 'C1', point: 'misog', reveals: ['sexist'], seg: [202.95, 214.25],
      stem: 'Why does Michael say “Thank you” after the comment?',
      choices: ['He hears her criticism as praise for him', 'He accepts her criticism with good grace',
                'He is mocking her with overly polite words'], a: 0,
      cue: '「Thank you」のあと、マイケルが続ける言葉。',
      line: 'What you’re saying is extremely *misogynistic*. … *Thank you.* … Women can do anything.',
      said: '「ひどく女性蔑視的」と言われ、マイケルは礼を言い、女性は何でもできると続ける。',
      mean: 'misogynistic（女性嫌悪の）を、ほめ言葉だと思い込んでいる。',
      trap: '礼を皮肉や「ご指摘どうも」と取りやすいが、続く言葉は上機嫌。難しい語は話し手も誤解する。',
      use: 'Thanks… wait, was that a compliment?（ありがとう…待って、今のほめ言葉？）' },

    // why: appreciate ← the -ed is swallowed before "it"; I'd appreciate ← "I" and the d of -ed blur into "I'd"
    { id: 's2', skill: 'sound', level: 'B2', point: 'appreciate', seg: [208.4, 212.15],
      stem: 'Fill the gap: “That was not necessary, but ___.”',
      choices: ['I appreciated it', 'I appreciate it', 'I’d appreciate it'], a: 0,
      cue: '「necessary, but」のあと、最後の語のつながり。',
      line: 'That was not necessary, but *I appreciated it*.',
      said: '「必要なかったけど、うれしかった」と言う。appreciated it は一続きに聞こえる。',
      mean: 'すでに言われた言葉へのお礼なので過去形。',
      trap: '-ed の d は弱く、次の it とつながって消えやすい。済んだことへの礼は過去形。',
      use: 'Thanks for the ride. I appreciated it.（送ってくれてありがとう、助かった）' },

    // why: worse than sexist ← the word's real meaning (女性嫌悪), which a learner knows and projects onto Michael; the
    //   same thing ← the woman's own view, said right after
    { id: 'i3', skill: 'infer', level: 'C1', point: 'misog', reveals: ['sexist'], seg: [214.2, 222.05],
      stem: 'From his reply, what does Michael think “misogynistic” means?',
      choices: ['Something good, unlike being sexist', 'Something even worse than being sexist',
                'The very same thing as being sexist'], a: 0,
      cue: '「No, I’m being…」と言い返す部分。',
      line: 'I’m saying that you’re being *sexist*. — *No, I’m being misogynistic.* … I am not being sexist.',
      said: '「性差別的だと言ってるの」に、マイケルは「違う、女性蔑視的なんだ」と返す。',
      mean: 'sexist を否定し、misogynistic を誇らしげに認める。彼の中では良い意味の語。',
      trap: '本当の意味を知っていると、彼も同じと考えがち。話し手の語の扱い方を聞く。',
      use: 'I’m not cheap, I’m careful with money.（ケチじゃなくて、節約家なの）' },

    // why: shows he cares ← the stock reason for a personal question (気づかい); stay away ← "know whether…" heard as a
    //   warning sign to keep clear of them
    { id: 'd2', skill: 'detail', level: 'B2', point: 'periods', seg: [233.05, 238.85],
      stem: 'When told what he asks them when they get mad, what reason does Michael give?',
      choices: ['He needs to know if they mean it', 'He wants to show them that he cares',
                'He needs to know when to stay away'], a: 0,
      cue: '文句を言われた直後、「I have to know」の先。',
      line: '…you always ask us if we’re on our periods. — I have to know *whether you’re serious or not*.',
      said: '「怒るといつも生理中かと聞く」と言われ、「本気かどうか知る必要がある」と答える。',
      mean: '怒りが本気かどうかを、生理のせいかで判断するという理屈。',
      trap: '個人的な質問の理由は「気づかい」と思いがち。whether ～ or not で何を知りたいかを聞く。',
      use: 'Are you serious or just joking?（本気？それとも冗談？）' },

    // R fix: V2 (blind 50 % and right): "never know what to say" was a filler, and the key was the only period
    //   reading. The new distractor is the same premise in the kind direction.
    // why: takes it seriously ← "I have to know whether you're serious" taken at face value (sincerity flip); go easy
    //   ← the period question heard as consideration (気づかい), not as a test of their anger
    // anchor: 233.5–238.7 s "when we get mad, you always ask us if we're on our periods", then "I have to know whether
    //   you're serious or not": the period question is his test of whether their anger is "serious"
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'periods', seg: [233.05, 238.85],
      stem: 'Which plain-English version keeps what Michael’s reason implies?',
      choices: ['“If it’s your period, your anger doesn’t count.”', '“If it’s your period, I should go easy on you.”',
                '“I ask because I take your anger seriously.”'], a: 0,
      cue: '何で「本気かどうか」を見分けているか。',
      line: '…you always ask us if we’re on our periods. — I have to know *whether you’re serious or not*.',
      said: '「怒るたびに生理中かと聞く」と言われ、「本気かどうか知らないといけないから」と答える。',
      mean: '生理のせいなら本気ではない、という前提が隠れている。怒りを真に受けないための質問だと自分で言っている。',
      trap: 'serious から「真剣に受け止めている」と取りやすい。理由の裏にある前提まで聞く。',
      use: 'You’re just tired, so it doesn’t count.（疲れてるだけだから、本気じゃないよね）' },
  ]
};
