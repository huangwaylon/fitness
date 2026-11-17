// REVIEW 2026-11-16: pass 8, fix 16, drop 0, new 0; ear checks 2
// REVIEW open: i1's Dwight distractor turns on who answers "Will never be her name"; the words settle it, so no
//   ear check. s2 is now a 2 × 2 (I'll/I'd × make/take); both sources have "I'll make".
// “Darwin, baby! Darwin... - The Office US” (the official The Office channel, BEST OF SEASON 5): Andy, who has just
// learned about Dwight and Angela, thanks the office for lying to him, then tells Dwight it's over; the argument turns
// into a duel over Angela, the weapons go from swords to guns, and Toby reads out the policy on workplace violence.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈206 s (whisper loops the last talking
// head after it). Untested: 49–54 s (the “love-making” brag), 106–111 s (Meredith's camcorder line), 151–156 s
// (“Darwin, baby” rests on world knowledge), 169–171 s (“Yay, Toby's here!” needs the show's history).
// EAR CHECK: 196.9 s nt2 — “I swear on my great-aunt's grave” is in the captions only (whisper: “Of course I did.”,
//   then the talking head's “No grave.”); the key needs the oath
// EAR CHECK: 164.6 s h3 — “Unless…” is taken as him hoping for more (not worry); the words carry it (“I just want to
//   see…”), but confirm it isn't said with concern
import type { Clip } from '../types.ts';

export const darwin: Clip = {
  id: 'darwin', video: 'yY-77aBc6TY', title: 'Darwin, baby! Darwin...', dur: 227, wpm: 153, band: 'mid',
  tags: ['職場', '恋愛'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %, the only non-thanks reading of the stem); distractors now a sincere reading of the same
    //   thanks and the "Not at all" hurt, so all three touch what he says
    // why: thankful ← the thanks taken at face value (thanks for sparing him); left alone ← "No. Not at all, actually"
    //   heard as the message (hurt, wants space)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'thanks', seg: [7.5, 22],
      stem: 'When Andy thanks the whole office, what is his message to them?',
      choices: ['He is angry that they all hid the truth', 'He is thankful they spared him the truth',
                'He is upset and wants to be left alone'], a: 0,
      cue: '2回目の「thank」のあと、何へのお礼か。',
      line: 'I’d also like to… *thank all of you for lying to my face*…',
      said: '「気づかってくれてありがとう」のあと、「顔を見て嘘をついてくれてありがとう」と続ける。',
      mean: 'お礼の形で、黙っていた全員を責めている。2回目の thank は皮肉。',
      trap: '1回目のお礼は本物なので、2回目も感謝に聞こえやすい。お礼は何へのお礼かで決める。',
      use: 'Thanks a lot for telling me.（教えてくれて、どうもね）' },

    // R fix: V2 (blind 60 %): "may go home early" was a filler; now "welcome" as 歓迎 (welcome back), parallel frames
    // why: apologizes ← the reply comes right after "lying to my face", where an apology "should" come; welcomes back ←
    //   welcome read as 歓迎 (おかえり), Andy has just walked in
    { id: 'h1', skill: 'humor', level: 'C1', point: 'welcome', reveals: ['thanks'], seg: [12.3, 22],
      stem: 'Why does the reply right after Andy’s speech get a laugh?',
      choices: ['Someone accepts his thanks as if it were real', 'Someone apologizes, but sounds pleased with it',
                'Someone welcomes Andy back as if all is fine'], a: 0,
      cue: '演説の最後の一言に、誰かがどう返すか。',
      line: '…*for lying to my face*… — *You are welcome.*',
      said: '皮肉の「ありがとう」に、誰かが「どういたしまして」と返す。',
      mean: '皮肉のお礼を本物として受けている。嘘を認めたうえ得意げで、空気が読めていない。',
      trap: 'welcome を「歓迎」と取ると別の話。thank you への決まった返事。',
      use: 'You’re welcome. Anytime!（どういたしまして。いつでも）' },

    // R fix: V2 (blind 65 %, the key was the only reply that touched the secret); "Anytime" is now "No problem… we
    //   didn't want you hurt": the secret named, but the thanks still taken at face value
    // why: no problem ← the thanks taken at face value (thanks for the cover; the clip's own reply takes it so);
    //   don't worry ← "No. Not at all" heard as a call for comfort (the Japanese frame: 慰めてほしい)
    // anchor: 15.5–20.5 s "for lying to my face and not telling me what's been going on" names what the thanks is
    //   for; 20.7 s "You are welcome" shows the wrong reading
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'thanks', seg: [12.3, 22],
      stem: 'Which reply from the office would match what Andy meant?',
      choices: ['Sorry, Andy. We should have told you.', 'No problem. We just didn’t want you hurt.',
                'Don’t worry. It’ll all work out, Andy.'], a: 0,
      cue: 'お礼の言葉の、「for」のあとの部分。',
      line: 'I’d also like to… *thank all of you for lying to my face and not telling me*…',
      said: '「何が起きているか言わずに、顔を見て嘘をついてくれてありがとう」と、全員に向けて言う。',
      mean: 'お礼の形をした非難。合う返事は、お礼への返事ではなく、隠していたことへの謝罪になる。',
      trap: 'ありがとうには「どういたしまして」という型で選びやすい。返事は言葉の形でなく、相手のしたことに返す。',
      use: 'You’re right. I should have said something.（そうだね、言うべきだった）', retired: true },

    // R fix: V2 (blind 55 %, the only choice about Angela); all three choices are now about Angela
    // why: admit ← the secret from the speech just before (he already knows; he never asks for a confession); let her
    //   choose ← the duel's "the winner gets Angela" later, carried back to what Andy asks for here
    { id: 'g1', skill: 'gist', level: 'B1', point: 'over', seg: [27.5, 64],
      stem: 'When Andy confronts Dwight, what does he want from him?',
      choices: ['To end things with Angela for good', 'To admit he has been seeing Angela',
                'To let Angela choose between them'], a: 0,
      cue: '「It’s over」のあと、Andy が言い直す一文。',
      line: 'No. It’s *over between you two*.',
      said: 'Andy は「お前たち二人が終わりだ」と言い直す。',
      mean: 'Angela と会うのをやめろ、という要求。Dwight は「あきらめない」と返す。',
      trap: '直前の「隠していた」が残ると告白の要求に思える。要求は言い直しの一文にある。',
      use: 'It’s over between us.（私たち、もう終わりね）' },

    // why: quitting ← "It's over" as an exit line (もう辞める); fight over ← "over" heard as the argument ending
    { id: 'd1', skill: 'detail', level: 'B1', point: 'brokeup', seg: [32.9, 40],
      stem: 'When Andy says “It’s over”, what does Dwight first think he means?',
      choices: ['Angela has left Andy', 'Andy is quitting his job', 'Their fight is over now'], a: 0,
      cue: 'Dwight の最初の返事、Oh good のあと。',
      line: 'Oh, good. *She broke up with you*.',
      said: '「終わりだ」に、Dwight は「よし、振られたんだな」と喜ぶ。',
      mean: 'break up with ＝ 恋人と別れる。Andy と Angela の話だと受け取った。',
      trap: 'over は「けんかが終わる」にも使えるが、答えは Oh good のあと。',
      use: 'Did you two break up?（二人、別れたの？）' },

    // why: had ← the /v/ lost, the vowel heard as had; 've got ← the same meaning, so a meaning-listener picks it;
    //   ought ← "have to" runs together as "hafta", near "oughta"
    { id: 's1', skill: 'sound', level: 'B2', point: 'haveto', seg: [41.2, 45.5],
      stem: 'Fill the gap in Andy’s reply to “I am not giving up”: “___ to.”',
      choices: ['You have', 'You had', 'You’ve got', 'You ought'], a: 0,
      cue: '「giving up」への短い返事と、その次の返事。',
      line: '*You have* to. — No, I don’t.',
      said: '「あきらめない」に「あきらめなきゃだめだ」、「いや、だめじゃない」と続く。',
      mean: 'have to は「ハフタ」とつながる。次の I don’t が現在形の合図。',
      trap: 'had to なら返事は I didn’t。聞き取りにくい語は、返事の形で確かめる。',
      use: 'You have to try this place.（この店、絶対行ってみて）' },

    // R fix: V2 (blind 70 %, the only choice with marriage); now a speaker swap (Dwight's name) and a before-name
    // why: marries Dwight ← the speakers swapped (Dwight is the one who answers "Will never be her name"); before ←
    //   a full name said on its own heard as who she was (旧姓), with "will be" missed
    { id: 'i1', skill: 'infer', level: 'B2', point: 'name', seg: [47.3, 60.9],
      stem: 'What is “Angela Bernard” in Andy and Dwight’s argument?',
      choices: ['The name she’ll take when she marries Andy', 'The name she’ll take if she marries Dwight',
                'The name she went by before she met Andy'], a: 0,
      cue: '名前のあと、二人が will で言い合う部分。',
      line: 'She’s *marrying me*. … Angela Bernard. — … It *will be her name*…',
      said: '「僕と結婚する」のあと、Andy は「それが彼女の名前になる」と言い張る。',
      mean: '結婚で名字が変わる前提。Bernard は Andy の名字で、勝ちの宣言。',
      trap: '言い合いでは話し手を取り違えやすい。誰が never と返したかを聞く。',
      use: 'She’s taking his last name.（彼女は彼の名字になる）' },

    // R fix: V2 (blind 60 %, the only peacemaking choice); all three are now ways of stepping in
    // why: what about ← "Why don't we…" read as a real why-question (なぜ); outside ← "cool off" read literally (外の
    //   空気で涼む)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'cooloff', seg: [63.5, 67.2],
      stem: 'When a coworker cuts in with “Hey, guys…”, what does the line do?',
      choices: ['Suggests they calm down a little', 'Asks what the fight is really about',
                'Tells them to take it outside'], a: 0,
      cue: '「Why don’t we」の形と、文末の言い方。',
      line: '*Why don’t we*, uh, just *cool off* a bit?',
      said: '言い合う二人に「ねえ、ちょっと頭を冷やさない？」と割って入る。',
      mean: 'Why don’t we ～? は「～しよう」という提案。cool off ＝ 落ち着く。',
      trap: 'Why を「なぜ」と取ると質問に聞こえる。cool off も「涼む」ではない。',
      use: 'Why don’t we take five?（ちょっと休憩しない？）' },

    // R fix: V2 (blind 60 %, the only choice about Angela); distractors now fit the scene too (they're close, loud).
    //   N7: the key states g1's key, so it reveals `over`
    // why: step back ← "back" + "down" read as a body movement (下がれ); voice ← "down" heard as "turn it down"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'backdown', reveals: ['over'], seg: [66.9, 70.8],
      stem: 'In the “I’m telling you…” exchange, what does Andy want Dwight to do?',
      choices: ['Give up and stop fighting him for her', 'Step back and stop standing so close',
                'Calm down and stop raising his voice'], a: 0,
      cue: '二人が同じ二語をくり返す部分と、その次の一言。',
      line: 'I’m telling you to *back down*. — … I will never *back down*.',
      said: 'Andy が「手を引け」と言い、Dwight は同じ言葉で「絶対に引かない」と返す。',
      mean: 'back down ＝ 対決から引き下がる。直前の「あきらめない」と同じ話。',
      trap: '体の動きと取ると「下がれ」に聞こえる。句動詞は前後の話で決める。',
      use: 'I’m not going to back down on this.（これは譲らないよ）' },

    // R fix: V2 (blind 70 %: "I made" didn't fit a threat); now a 2 × 2 of I'll/I'd × make/take, all real threats
    // why: I'd ← I'll and I'd both shrink to a short "aɪ"; take ← the m of "make" lost after the vowel ("then I'll
    //   take you" = take you on)
    { id: 's2', skill: 'sound', level: 'B2', point: 'makeyou', reveals: ['backdown'], seg: [66.9, 72.5],
      stem: 'Fill the gap in Andy’s answer: “Then ___ you.”',
      choices: ['I’ll take', 'I’ll make', 'I’d make', 'I’d take'], a: 1,
      cue: '「never back down」への返事の最初の数語。',
      line: 'I will never back down. — Then *I’ll make* you.',
      said: '「絶対に引かない」に、Andy が「なら引かせてやる」と返す。',
      mean: 'make you ＝ むりやり～させる。脅しなので、これからの話。',
      trap: 'I’ll の l は弱く I’d に聞こえやすい。動詞は back down とつなげて確かめる。',
      use: 'If you won’t tell him, I will.（君が言わないなら、僕が言う）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'gonna', seg: [69.95, 72.5],
      stem: 'Type what Dwight says: “Oh, really? ___ do that?” (4 words)', answer: 'how are you gonna',
      cue: '「make you」のすぐあと、短い問い返し。',
      line: 'Oh, really? *How are you gonna* do that?',
      said: '「へえ、どうやってやるつもりだ？」と挑発するように聞き返す。',
      mean: 'gonna ＝ going to。how are you は「ハウアユ」と一続きになる。',
      trap: '辞書の形に直したくなるが、聞こえたまま書く。are は弱く消えかける。',
      use: 'How are you gonna get home?（どうやって帰るつもり？）' },

    // why: scared a bit ← "scare me" heard without "does not… in the slightest"; pretends ← the tough-guy script,
    //   where the hero mocks a threat with fake fear
    { id: 'h2', skill: 'humor', level: 'C1', point: 'general', seg: [71.5, 77],
      stem: 'After Andy says how he’ll do it, why is Dwight’s reply funny?',
      choices: ['He criticizes the threat for being too vague', 'He admits the threat has scared him a bit',
                'He pretends to be scared to tease Andy'], a: 0,
      cue: '「force」への返事、最初の形容詞。',
      line: 'Through the use of force. — That is *very general* and does not scare me in the slightest.',
      said: '「力ずくで」と言われ、「ずいぶん大まかで、少しも怖くない」と返す。',
      mean: '脅しを答案のように「具体性が足りない」と評価する。けんか中のずれ。',
      trap: 'scare me だけ拾うと怖がって聞こえる。not … in the slightest は「少しも」。',
      use: 'That’s a little too general.（それはちょっと大まかすぎる）' },

    // R fix: V2 (blind 55 %, the only choice with a reason tied to the place); all three are now a move plus a reason
    // why: they won't listen ← he does back off, but "then" missed, so the reason is guessed; insists ← "your
    //   business" heard again and taken as the same claim restated
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'business', seg: [87.9, 98.5],
      stem: 'In the “none of your business” back-and-forth, what does the coworker’s last line do?',
      choices: ['Gives up, since it won’t happen at work', 'Gives in, since they won’t listen anyway',
                'Insists, since it is still his business'], a: 0,
      cue: '同じ言葉を返す最後の一言と、文末の一語。',
      line: 'it is *my business*… at work. — … Outside of work. … — *None of your business, then.*',
      said: '「職場のことなら僕の問題だ」と止めるが、「外でやる」と言われ「なら関係ない」と返す。',
      mean: '自分で「職場なら」と条件をつけたので、反論できずに引き下がる。',
      trap: 'くり返しは念押しにも聞こえる。文末の then は「それなら」で、受け入れの合図。',
      use: 'Not my problem, then.（それならこっちは関係ないね）' },

    // why: 63 ← sixty/seventy blur at speed; 70 ← the final "three" swallowed before "centimeter"; 83 ← eighty and
    //   seventy both end in -ty
    { id: 'n1', skill: 'number', level: 'B1', point: 'length', seg: [111.6, 116.75],
      stem: 'How long is the samurai sword Dwight offers to use?',
      choices: ['63 centimeters', '70 centimeters', '73 centimeters', '83 centimeters'], a: 2, keep: true,
      cue: '「I’ll use a」のすぐあとの数字。',
      line: 'Okay, I’ll use a *73-centimeter* samurai.',
      said: 'Dwight は「73センチの日本刀を使う」と言う。',
      mean: 'seventy-three は「セヴンティスリー」。長さまで決めるのが Dwight らしさ。',
      trap: 'three は centimeter の前で短くなる。-ty のあとにもう一語あるかを聞く。',
      use: 'It’s about seventy centimeters long.（長さは70センチくらい）' },

    // R fix: V2 (blind 60 %, the key was the only two-part choice); all three are two-part now
    // why: owns some ← "I don't have a samurai" heard as lacking that one kind only; knows them well ← the hesitation
    //   "Mmm, I don't…" read as reluctance, not ignorance
    { id: 'i2', skill: 'infer', level: 'B2', point: 'nosword', seg: [114.6, 123.6],
      stem: 'What do Andy’s replies about the swords show?',
      choices: ['He owns no swords and knows little about them', 'He owns swords, just not the kind Dwight names',
                'He knows swords well but finds them too risky'], a: 0,
      cue: 'Dwight の提案への、Andy の短い返事2つ。',
      line: 'I *don’t have* a samurai. … I don’t… *what is that?*',
      said: '日本刀は「持ってない」、両手持ちの大剣には「…それ何？」と返す。',
      mean: '剣を持っていないうえ、種類も知らない。Dwight だけが本気で準備している、という差。',
      trap: '言いよどみをためらいと取りやすい。中身は「ない」「それ何？」だけ。',
      use: 'Sorry, what is that?（すみません、それ何ですか）' },

    // R fix: V2 (blind 55 %, the only choice tied to Andy); now "closest" heard as "best"
    // why: best for a duel ← "closest" heard as a superlative of quality; only gun ← "the… thing I have" heard as all
    //   he has
    { id: 'd2', skill: 'detail', level: 'B2', point: 'match', seg: [123.4, 129.7],
      stem: 'Why does Dwight choose the weapon he names last?',
      choices: ['It is the nearest thing to Andy’s weapon', 'It is the best thing he has for a duel',
                'It is the only gun he keeps at home'], a: 0,
      cue: '「Fine,」のあと、that が指すもの。',
      line: 'Fine, *the closest thing I have to that* is a Nitro Express.',
      said: 'Andy の答えを聞き、「それに一番近い手持ちはこれだ」と言う。',
      mean: '相手の武器に合わせ、自分の物から一番近い物を選んでいる。対等に戦うため。',
      trap: 'closest を best と聞くと「一番いい物」。to that（それに）が要。',
      use: 'The closest thing we have is this one.（一番近いのはこれですね）' },

    // why: birds ← "pheasant" heard, "elephants" missed; Andy's stronger ← the two names heard in swapped order
    { id: 'i3', skill: 'infer', level: 'B2', point: 'elephant', seg: [132.2, 137.3],
      stem: 'What is the coworker’s point about the two guns?',
      choices: ['Dwight’s is far stronger than Andy’s', 'Both are only meant for hunting birds',
                'Andy’s is the more dangerous of the two'], a: 0,
      cue: '2つの獲物の大きさの差。',
      line: 'Andy’s is for *hunting pheasant*, and Dwight is for *killing elephants*.',
      said: '「Andy のはキジ撃ち用、Dwight のはゾウを仕留める用」と説明する。',
      mean: '鳥とゾウの差で、Dwight の銃がけた違いに強いと伝えている。',
      trap: 'pheasant だけ聞くと両方とも鳥用に思える。2つ並んだら、比べる物の差を聞く。',
      use: 'That’s not a fair fight.（それじゃ勝負にならない）' },

    // R fix: V2 (blind 60 %, "unsure and needs help" a filler); parallel "turn his yes into…" frames
    // why: prayer for luck ← "help me God" read literally as a prayer to win; doubt ← "help me" heard as asking for
    //   help (困った)
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'sohelp', seg: [139.95, 146.3],
      stem: 'What do the words Andy puts before “I do” add to his answer?',
      choices: ['They turn his yes into a solemn oath', 'They turn his yes into a prayer for luck',
                'They show he says yes with some doubt'], a: 0,
      cue: '「I do」の直前の三語。',
      line: '*So help me God*, I do.',
      said: '「賞品は Angela だと分かっているか」に、「神に誓って、分かっている」と答える。',
      mean: '法廷の宣誓などの「誓って」。けんかの確認に大げさに答えている。',
      trap: 'help me を文字通りに取ると「助けて」。決まり文句は形で覚える。',
      use: 'I promise you, I’ll be there.（約束する、必ず行く）' },

    // R fix: V2 (blind 55 %, "stopped in time" a filler against "Darwin"); now the right man / Andy standing up
    // why: right man ← "who Angela ends up with" heard without "I don't care"; Andy stands up ← the underdog script
    //   (the bullied one finally fights back)
    { id: 'd3', skill: 'detail', level: 'B2', point: 'stanley', seg: [154.35, 164.2],
      stem: 'In the talking head after “Darwin, baby”, what does the speaker want?',
      choices: ['To see one of them get beaten up', 'To see Angela pick the right man',
                'To see Andy finally stand up to Dwight'], a: 0,
      cue: '「I don’t care」と、そのあとの「I just want」。',
      line: 'I *don’t care* who Angela ends up with. I just want to see one of them *beat the crap out of* the other one.',
      said: '「どっちと結ばれても構わない。どっちかがぼこぼこにされるのが見たい」と言う。',
      mean: '恋の結末に興味はなく、けんかそのものが楽しみ。I just want が本音。',
      trap: 'ends up with だけだと応援に聞こえる。just want のあとが本音。',
      use: 'I don’t care who wins.（どっちが勝っても構わない）' },

    // R fix: V2 (blind 60 %, the only "likes it" choice); two "He'd enjoy it more if…" choices now
    // why: fears ← the question heard as concern (the sincere reading); does the fighting ← "Angela… beat(en) up"
    //   heard as Angela beating someone up
    { id: 'h3', skill: 'humor', level: 'C1', point: 'unless', reveals: ['stanley'], seg: [159.2, 169.8],
      stem: 'Why is the speaker’s “Unless…” at the end funny?',
      choices: ['He’d enjoy it more if Angela got hurt too', 'He’d enjoy it more if Angela did the fighting',
                'He suddenly fears Angela could get hurt too'], a: 0,
      cue: '「I just want」と、そのあとの言い足し。',
      line: 'I just want to see one of them beat… the other one. *Unless…* Do you think *Angela could get beaten up*?',
      said: '「やられるのが見たい。…いや、Angela がやられることもある？」と言い足す。',
      mean: 'Unless は「もっといい場合」の言い足し。心配でなく、さらに見たい物を思いついた笑い。',
      trap: '問いの形だけだと心配に聞こえる。beaten up はやられる側。',
      use: 'Unless… you want to come too?（それとも…一緒に来る？）' },

    // why: what it's about ← a manager's usual script (hear both sides first); outside ← "outside of work" from the
    //   duel talk, in the wrong relation
    { id: 'g2', skill: 'gist', level: 'B1', point: 'toby', seg: [170, 191.8],
      stem: 'Why does Toby come over at the end?',
      choices: ['To remind everyone the rules ban fighting', 'To ask Dwight and Andy what the fight is about',
                'To check that the duel will be outside work'], a: 0,
      cue: 'Toby の最初の問いかけ。',
      line: 'do I have to go over our *policy on workplace violence*?',
      said: 'Toby が来て「暴力の方針を説明しないといけない？」と聞き、規則を読む。',
      mean: '決闘の話を聞きつけ、会社の規則で止めに来た。go over ＝ ひと通り説明する。',
      trap: '場所は前の場面の話。Toby は理由も場所も聞かず、規則の話だけ。',
      use: 'Let’s go over the plan again.（もう一度予定を確認しよう）' },

    // why: fighting ← what he means, filled in by the listener; outside ← "outside of work" from the duel talk before
    { id: 'h4', skill: 'humor', level: 'C1', point: 'whatsoever', seg: [178.4, 187.7],
      stem: 'Taken word for word, what does Toby’s first rule ban?',
      choices: ['Doing anything at all', 'Any fighting at work', 'Anything outside of work'], a: 0,
      cue: '会社名のあと、最初の文の終わり方。',
      line: 'Dunder Mifflin does not condone *any activity whatsoever*.',
      said: '「いかなる活動も一切認めない」と言い、次の文で「危険なこと」と言い直す。',
      mean: 'whatsoever で文が終わると、仕事も含めて全部禁止になる。言葉足らずが笑い。',
      trap: '補って聞くと「けんか禁止」になる。文がどこで終わったかを聞く。',
      use: 'No exceptions whatsoever.（例外は一切なし）' },

    // R fix: V2 (blind 55 %, "nervously" a weak frame); now "firmly" and "warmly", both built on words said
    // why: firmly ← "very clear… crystal clear" heard as a real promise; warmly ← "No, we're fine" just before, heard
    //   as reassurance (the Japanese frame: 心配させまいとする)
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'whatever', seg: [186.4, 191.8],
      stem: 'When Toby asks if they understand, how does the office answer?',
      choices: ['Quickly, just to get it over with', 'Firmly, to show they will obey the rules',
                'Warmly, to assure him they are fine'], a: 0,
      cue: '答えの数と、短い返事のくり返し。',
      line: 'Fine. — *Yeah, yeah*… We get it. … Crystal clear.',
      said: '「はいはい」「分かった」「とても明確」と、短い返事が次々に重なる。',
      mean: '短い返事が重なるのは、早く終わらせたい合図。yeah, yeah は「はいはい」。',
      trap: 'crystal clear だけ拾うと約束に聞こえる。返事の重なり方で温度を聞く。',
      use: 'Yeah, yeah, I get it.（はいはい、分かったよ）' },

    // R fix: V2 (blind 75 %, the key the only one naming the grave); all three now rest on the grave/aunt
    // why: sincere ← the oath taken at face value (墓に誓う is heavy in Japanese too); a joke Toby gets ← the to-camera
    //   line heard as part of the scene with Toby
    // anchor: 196.9–199 s "I swear on my great-aunt's grave" (captions), then to camera 201.4–205.5 s "No grave. Fell
    //   into a combine…": the oath rests on nothing, and Toby never hears that
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'grave', seg: [191.6, 206.5],
      stem: 'After Dwight’s comment to the camera, how should we hear his promise to Toby?',
      choices: ['As empty: the grave he swore by isn’t real', 'As sincere: his aunt’s grave means a lot to him',
                'As a joke: Toby knows there is no grave'], a: 0,
      cue: 'Toby への誓いと、カメラへの最初の二語。',
      line: 'Of course I did. *I swear on my great-aunt’s grave.* … *No grave.* Fell into a combine.',
      said: '武器は片づけたと言い、大おばの墓に誓う。カメラには「墓はない。農機に巻き込まれた」と話す。',
      mean: '誓いの土台がないと明かし、約束が空っぽだったと伝えている。カメラへの一言が場面を書きかえる。',
      trap: '墓に誓う、は日本語でも重いので本気に聞こえる。この形式では、カメラへの一言が答え合わせ。',
      use: 'I swear on my life.（命にかけて誓うよ）', retired: true },
  ]
};
