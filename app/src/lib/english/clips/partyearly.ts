// REVIEW 2026-11-16: pass 5, fix 15, drop 0, new 0; ear checks 0
// OPEN: who says "I am on my way… about 15" (Michael or Jan) is unsettled; n1 no longer depends on it.
// “Michael and Dwight Rock Up to the Party Early - The Office US” (the official The Office channel, Best of Season 3):
// on the drive, Jan calls on speakerphone; at the house, one of them is dressed like the staff and they swap shirts;
// a to-camera case for arriving early; a potato salad that has sat in a hot car all day.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 130 s (whisper loops one line from
// 132 s). The captions drop most of 14.8–38 s and 41–51 s; nothing here rests on those stretches. Untested on purpose:
// 14.8–17.3 s and 30–36 s (whisper only, and sexual), 26.6–28.8 s ("No problem" garbled in the captions), 38–41 s
// ("a very big step for us" needs the couple's backstory), 54–59 s ("Beauty… thank you, sir", garbled), 78–85 s
// (whose jacket, and "don't give me that": rests on what's shown), 102–103.8 s ("ergo" is whisper only), 129.9 s on.
// The caller is Jan: she greets Dwight and Michael by name (24.1–24.8 s, both sources). The host and the speakers at
// the house are never named, so no item asks who says what there.
import type { Clip } from '../types.ts';

export const partyEarly: Clip = {
  id: 'partyearly', video: 'YJR238M6XJA', title: 'Michael and Dwight Rock Up to the Party Early', dur: 150, wpm: 151,
  band: 'mid', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %, right): "a fight" and "a host who wants them gone" were off-scene; all three are now
    //   "little slip-ups…", differing in what they do about them
    // why: blame each other ← "Shut up" and "No, it's not" heard as finger-pointing; host noticing ← the host's short
    //   "Hi" and "Oh, a potato salad" read as noticing, but the two of them point out and fix their own slips
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['mayo', 'shirts'], seg: [0, 130.0],
      stem: 'Across the clip, what keeps making things awkward?',
      choices: ['Little slip-ups they keep trying to fix', 'Little slip-ups they blame on each other',
                'Little slip-ups the host keeps noticing'], a: 0,
      cue: '服のこと、手土産のこと。それぞれ何が起きるか。',
      said: '服の問題をシャツの交換で直し、着いてからは手土産のサラダが危ないかもと言い出す。',
      mean: '小さな失敗と、その場しのぎの手当てが続く場面。',
      trap: '言い合いがあるので責め合いに見えるが、二人は自分たちで手当てしている。何をして収めるかを聞く。',
      use: 'One thing after another today.（今日は次から次へと）' },

    // anchor: 2.5–6.4 s "Oh, sure. Really didn't give it any thought. Wait, should you be going?": one whisper turn,
    //   one voice; the doubt about the invitation comes right after "no thought", so "no thought" was literal
    // why: modestly ← the usual reply to thanks (お気になさらず), taken as politeness; bluntly ← "should you be going?"
    //   heard as "you should go", an order
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'thought', reveals: ['going', 'thoughtd'], seg: [0.2, 7.1],
      stem: 'After “Wait, should you be going?”, how should we hear “didn’t give it any thought”?',
      choices: ['Literally: he never thought the invite through', 'Modestly: asking him along was no trouble',
                'Bluntly: he is telling him to go home'], a: 0,
      cue: 'お礼への返事のあと、同じ人が付け足す問い。',
      line: 'Thanks for inviting me along. — Oh, sure. Really *didn’t give it any thought*. Wait, *should you be going?*',
      said: 'お礼に「何も考えてなかった」と答え、すぐ「待って、君は来ていいんだっけ？」と聞く。',
      mean: 'ふつうは「気にしないで」の謙遜。直後の問いで、文字どおり考えずに誘ったと分かる。',
      trap: 'お礼への返事は謙遜、という型で聞きやすい。決まり文句の直後の一言が、本当の意味を決める。',
      use: 'Honestly, I didn’t think it through.（正直、よく考えてなかった）' },

    // why: Shouldn't ← n't's t drops, and "shouldn't you be going?" is a common hint to leave; Should I ← "you"
    //   weakened to "ya" heard as "I"; Would you ← the sh/w onset lost right after "Wait"
    { id: 's1', skill: 'sound', level: 'B2', point: 'going', seg: [3.3, 7.1],
      stem: 'Fill the gap: “Wait, ___ be going?”',
      choices: ['should you', 'shouldn’t you', 'should I', 'would you'], a: 0,
      cue: '「Wait」のすぐあと、短い2語。',
      line: 'Wait, *should you* be going?',
      said: '「待って、君も行くべきなのかな？」と、相手が来ることを疑う。',
      mean: 'should you は「シュジュ」とつながる。d と y がくっついて「ジュ」になる。',
      trap: 'shouldn’t you なら「もう行かなきゃ」の催促。n’t の「ン」の有無で決める。',
      use: 'Should you be lifting that?（それ、持って大丈夫？）' },

    // anchor: 3.8–5.0 s both sources have "really didn't give it any thought", with no "I": six words in ≈ 1.2 s,
    //   "didn't give it" run together
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'thoughtd', seg: [3.3, 5.5],
      stem: 'Type the reply after “Oh, sure.” (6 words)', answer: 'really didn\'t give it any thought',
      cue: '「Oh, sure」のすぐあと。主語に注意。',
      line: 'Oh, sure. *Really didn’t give it any thought*.',
      said: 'お礼に「何も考えてなかった」と返す。主語の I がなく、6語が1秒ほどで言われる。',
      mean: '会話では文頭の I がよく落ちる。didn’t give it は「ディドゥンギヴィッ」と一続きになる。',
      trap: '文法どおり I を足したくなるが、言っていない。書き取りは、聞こえた語だけを書く。',
      use: 'Didn’t see you there. Hi!（いるの気づかなかった、やあ！）' },

    // why: 50 ← -teen/-ty: "fifteen" is cut off, and its stressed "-teen" is short; 5 ← only "fif-" caught
    // R fix: C10/S1: the stem named Michael as the speaker, which needed an ear check (it could be Jan); the number
    //   doesn't depend on who says it
    { id: 'n1', skill: 'number', level: 'B1', point: 'fifteen', seg: [11.9, 15.4], keep: true,
      stem: 'On the call, how soon does the speaker expect to be there?',
      choices: ['In about 5', 'In about 15', 'In about 50'], a: 1,
      cue: '「on my way」のあと、最後の数。',
      line: 'I am on my way. Should be there… about *15*—',
      said: '電話で「今向かってる。15分くらいで着く」と言いかけて切れる。',
      mean: 'fifteen は後ろの -teen が強く長い。途中で切れても「ティーン」の伸びが残る。',
      trap: '-teen と -ty は強さの位置がちがう。fifty なら前の「フィフ」が強い。',
      use: 'I’ll be there in fifteen.（15分で着くよ）' },

    // R fix: V2 (blind 55 %, right): "call back" was a filler; now "put her on speakerphone" (off/on, a near sound)
    // why: put her on ← "off" is short and weak, heard as "on"; put Dwight on ← "Hi, Dwight" heard as asking for him
    { id: 'd1', skill: 'detail', level: 'B1', point: 'speaker', seg: [22.3, 26.5],
      stem: 'What does the caller ask Michael to do?',
      choices: ['Take her off speakerphone', 'Put her on speakerphone', 'Put Dwight on the line'], a: 0,
      cue: '「Okay, Michael」のあと。',
      line: 'Hi, Dwight. Okay, Michael, *take me off speakerphone*.',
      said: '電話の相手が「Michael、スピーカーをやめて」と頼む。',
      mean: 'スピーカー通話をやめて、二人だけで話したいということ。',
      trap: 'off は短く弱いので on と取りやすい。Hi, Dwight にも引っぱられず、take me のあとを聞く。',
      use: 'Can you take me off speaker?（スピーカー、切ってくれる？）' },

    // R fix: V2 (blind 65 %, right): "the line cutting out" was a filler; all three now turn on Dwight
    // why: wants Dwight to hear ← "take me off" misheard as "put me on" (d1's trap); can't hear Michael ← two voices
    //   on one phone read as noise, but nothing about hearing is said
    { id: 'i1', skill: 'infer', level: 'B2', point: 'speaker', seg: [22.3, 26.5],
      stem: 'Judging by her greeting just before, why does the caller ask that?',
      choices: ['She doesn’t want Dwight to hear', 'She wants Dwight to hear it too',
                'She can’t hear Michael over Dwight'], a: 0,
      cue: '頼む直前に、誰にあいさつしたか。',
      line: '*Hi, Dwight.* Okay, Michael, take me off speakerphone.',
      said: 'Dwight にあいさつした直後に、スピーカーをやめてと頼む。',
      mean: 'Dwight にも聞こえていると気づき、二人だけで話したくなった、ということ。',
      trap: 'Dwight の名前から、Dwight も加えたいと取りやすい。あいさつは「聞いてるのね」の確認。',
      use: 'Wait, am I on speaker?（待って、スピーカーになってる？）' },

    // why: too casual ← the usual dress-code worry at a party; like the host ← "dressed exactly like" heard with the
    //   wrong person after it
    { id: 'd2', skill: 'detail', level: 'B1', point: 'servants', seg: [59.3, 64.6],
      stem: 'What is wrong with how one of them is dressed?',
      choices: ['He looks just like the staff', 'He is much too casual', 'He is dressed just like the host'], a: 0,
      cue: '「dressed exactly like」のあと。',
      line: 'You’re dressed *exactly like the servants*.',
      said: '「使用人とまったく同じ服装だぞ」と指摘される。',
      mean: 'servants ＝ 使用人。給仕と同じ服では、客に見えない。',
      trap: '服の話なので「カジュアルすぎ」を思いつきやすい。exactly like のあとの語で決める。',
      use: 'You look exactly like the waiter.（ウェイターにそっくりだよ）' },

    // R fix: V2 (blind 55 %, right) and K5: the choices weren't parallel; now three "look vs fit" readings
    // why: fit first ← "won't fit me" is the last thing heard, read as the deciding worry; neither ← "I don't care"
    //   read literally, as not caring about clothes at all
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'shirts', seg: [65.3, 71.7],
      stem: 'When told his shirt won’t fit, what does the reply show?',
      choices: ['The look matters more than the fit', 'The fit matters more than the look',
                'Neither the look nor the fit matters'], a: 0,
      cue: '「won’t fit me」への短い返事。',
      line: 'Okay, *change shirts*. — I don’t think yours will fit me. — *I don’t care*.',
      said: '「シャツを替えろ」と言い、「合わない」と返されても「かまわない」。',
      mean: 'I don’t care ＝ サイズなんてどうでもいい。とにかく見た目を直したい。',
      trap: 'I don’t care を「服に興味がない」と取りやすい。何が「どうでもいい」かを聞く。',
      use: 'I don’t care if it’s small. Try it.（小さくてもいいから、着てみて）' },

    // R fix: V2 (blind 50 %, right): "will be" was the weak one and left "would have been" the only past; now
    //   "could have been" (a near sound)
    // why: could have been ← the onset of a weak "would" lost, "-ould've" heard; would be ← the reduced "would've" ≈
    //   "woulda" loses its v; wouldn't be ← "-'ve" heard as a nasal
    { id: 's2', skill: 'sound', level: 'B2', point: 'embarr', seg: [84.3, 88.3],
      stem: 'Fill the gap: “That ___ really embarrassing.”',
      choices: ['would have been', 'could have been', 'would be', 'wouldn’t be'], a: 0,
      cue: '「That」のあと、弱くつながる部分。',
      line: 'That *would have been* really embarrassing.',
      said: 'シャツを替えたあと、「あのままなら恥ずかしかった」と言う。',
      mean: 'would have been は「ウダビン」と縮む。避けたことを振り返る形。',
      trap: 'have は「ア」程度に弱く、would be に聞こえやすい。been の「ビン」が手がかり。',
      use: 'That would have been a disaster.（それは大変なことになってたね）' },

    // R fix: V2 (blind 75 %, right): the choices weren't parallel; all three are now about "a disaster"
    // why: still coming ← "crisis" heard without "averted"; best ignored ← avert read as "avert your eyes" (目をそらす)
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'crisis', seg: [84.3, 91.0],
      stem: 'Right after the “really embarrassing” line, what does the short reply mean?',
      choices: ['A disaster was just avoided', 'A disaster is still on its way', 'A disaster is best ignored'], a: 0,
      cue: '「Yes」のあとの2語。',
      line: 'Yes, *crisis averted*.',
      said: '「恥ずかしかった」に「ああ、危機回避だ」と返す。',
      mean: 'crisis averted ＝ 危ないところで避けられた。少し大げさに安心を表す決まり文句。',
      trap: 'avert は「目をそらす」にも使うので、見ないふりと取りやすい。crisis と組むと「回避」。',
      use: 'Found my keys. Crisis averted!（鍵あった。危機回避！）' },

    // R fix: V2 (blind 75 %, right): "right after swapping" made "relieved" common sense; the choices now each name what
    //   the feeling is about, and "embarrassed it happened" is the literal reading
    // why: embarrassed ← "really embarrassing" is the keyword, but "would have been" says it didn't happen; worried it
    //   shows ← "Okay" read as unsure
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'crisis', reveals: ['embarr'], seg: [84.3, 91.0],
      stem: 'How do they feel right after swapping shirts?',
      choices: ['Relieved it got fixed', 'Embarrassed it happened', 'Worried it still shows'], a: 0,
      cue: '「would have been」の文と、そのあとの返事。',
      line: 'That *would have been* really embarrassing. — Yes, *crisis averted*.',
      said: '「あのままなら恥ずかしかった」「危機回避だ」と言い合う。',
      mean: 'もう避けられたので、ほっとしている。',
      trap: 'embarrassing が残ると「恥ずかしい」を選びやすい。would have been は起きなかったこと。',
      use: 'Phew, that was close.（ふう、危なかった）' },

    // R fix: S3: the cue quoted "really good friends", words only the key has
    // why: help the host ← the usual reason guests come early; first impression ← "polite" is heard first
    { id: 'g2', skill: 'gist', level: 'B2', point: 'early', seg: [91.1, 106.15],
      stem: 'In the comment to the camera, what is the point of arriving early?',
      choices: ['To become a really good friend', 'To help the host get things ready', 'To make a good first impression'],
      a: 0,
      cue: '「only」で始まる一文と、そこからの理屈。',
      line: 'Only really good friends show up early. … go to a party early, *become a really good friend*.',
      said: '「早く来るのは本当の友だちだけ。だから早く行けば本当の友だちになれる」と話す。',
      mean: '早く着いたのは、主人と親しくなるため、という理屈。',
      trap: 'polite が聞こえるので、礼儀や好印象が目的と取りやすい。最後に何に「なる」かで決める。',
      use: 'Come early and grab a good seat.（早めに来て、いい席を取って）' },

    // R fix: S3: the cue said "And", which only the key has (the others have "but")
    // why: polite but risky ← "Actually" heard as a correction ("actually, it's not great"); rude but smart ← "polite"
    //   lost after "it's"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'polite', seg: [93.9, 98.9],
      stem: 'What two words does the comment to the camera use for arriving early?',
      choices: ['Polite and smart', 'Polite but risky', 'Rude but smart'], a: 0,
      cue: '「Actually, it’s」のあとと、最後の一語。',
      line: 'Actually, it’s *polite* to arrive early. And *smart*.',
      said: '「実は、早く着くのは礼儀正しいし、賢い」とカメラに話す。',
      mean: 'Actually ＝ 実は。早すぎると思われそうなことへの反論から入っている。',
      trap: 'Actually を否定の前置きと取ると「失礼」に聞こえやすい。続く polite をそのまま聞く。',
      use: 'Actually, it’s cheaper to go by train.（実は、電車のほうが安いよ）' },

    // R fix: V2 (blind 70 %, right): the key was the only abstract choice, and the stem quoted g2's key ("really good
    //   friends"); now three short parallel "He…" choices and a stem that names the moment
    // why: no friends ← "become a really good friend" heard as an admission about themselves; mocks late guests ←
    //   "only… show up early" heard as a dig at everyone else
    { id: 'h1', skill: 'humor', level: 'C1', point: 'early', seg: [99.0, 106.15],
      stem: 'Why is his case for arriving early funny?',
      choices: ['He reverses cause and effect', 'He mocks people who come late', 'He admits he has no friends'], a: 0,
      cue: '前半と後半で、「早く来る」と「友だち」の順番。',
      line: 'Only really good friends show up early. … go to a party early, become a really good friend.',
      said: '「本当の友だちは早く来る。だから早く行けば本当の友だちになれる」と言う。',
      mean: '友情の結果である「早めの到着」を、友情の原因にしてしまう、さかさまの理屈が笑い。',
      trap: '遅れて来る人への皮肉と取りやすいが、話は自分たちのこと。何と何が入れかわったかを聞く。',
      use: 'That’s not how it works.（そういうものじゃないよ）' },

    // R fix: V2 (blind 60 %, right): the choices weren't parallel; all three now "Says/Agrees…" about the salad
    // why: not potato salad ← "No, it's not" heard as answering "Oh, a potato salad"; agrees ← "No" lost, and "it's
    //   not" heard as "it's nothing" (いえいえ, the 遠慮 frame)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'both', seg: [105.9, 111.5],
      stem: 'When the salad is said to be from both, what does the reply do?',
      choices: ['Says only one of them brought it', 'Agrees it’s from the two of them',
                'Says it isn’t really potato salad'], a: 0,
      cue: '「both of us」への、すぐの返事。',
      line: '…from *both of us*. — *No, it’s not.*',
      said: '「二人からです」と一人が言うと、もう一人が「いや、違う」とすぐ打ち消す。',
      mean: '手土産の手柄を分け合うのを拒んでいる。持ってきたのは自分だけ、という主張。',
      trap: '直前の「ポテトサラダね」への返事と取ると、中身の話に聞こえる。返事は直前の一言に向く。',
      use: 'Actually, that one’s just from me.（実はそれ、私からだけなの）' },

    // R fix: V2 (blind 55 %, right) and K6: the key was the only "gently"; all three now start "Gently…"
    // why: save it ← "until the guests get here" heard as a request to keep it for later; a surprise ← "leave the cover
    //   on" heard as keeping it hidden
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'cover', reveals: ['mayo'], seg: [115.8, 123.2],
      stem: 'When the guest who brought the salad speaks up, what is he doing?',
      choices: ['Gently warning the host about it', 'Gently asking the host to save it',
                'Gently asking to keep it a surprise'], a: 0,
      cue: '「you probably want to」の働き。',
      line: '*You probably want to* leave the cover on until the guests get here.',
      said: '「ゲストが来るまで、ふたはしておいたほうがいいかも」と言う。',
      mean: 'you probably want to 〜 ＝「〜したほうがいいよ」。やわらかい忠告の形。',
      trap: 'want を「あなたが望む」と取ると、相手の気持ちの話に聞こえる。ここは遠回しな注意。',
      use: 'You probably want to bring a jacket.（上着は持っていったほうがいいよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'cover', seg: [115.8, 120.2],
      stem: 'Type the advice: “You probably want to ___ until the guests get here.” (4 words)',
      answer: 'leave the cover on',
      cue: '「want to」のあと。',
      line: 'You probably want to *leave the cover on* until the guests get here.',
      said: '「ゲストが来るまで、ふたはしておいて」と勧める。',
      mean: 'cover on は「カヴァロン」とつながる。leave ~ on ＝ 〜をつけたままにする。',
      trap: 'the は弱く、cover と on がつながるので、語の数が分かりにくい。4語を確かめて書く。',
      use: 'Leave the lights on, please.（電気はつけたままにしてね）' },

    // R fix: V2 (blind 75 %, right) and S3: the cue said he worries about his own gift (the key). Choices now three
    //   "He warns…"
    // why: the host's food ← "you probably want to" heard as about the host's table; the weather ← "the sun beating
    //   down" is the keyword, but it's the mayonnaise he means
    { id: 'h2', skill: 'humor', level: 'C1', point: 'mayo', reveals: ['cover'], seg: [115.8, 129.9],
      stem: 'Why does his advice about the salad get a laugh?',
      choices: ['He warns them off his own gift', 'He warns them off the host’s food', 'He warns them about the heat'], a: 0,
      cue: '「you never know」で終わる一続きの話。',
      line: 'you probably want to *leave the cover on*… The sun beating down on the mayonnaise. Just, *you never know*.',
      said: '持ってきたサラダに「ふたは取らないで、何があるか分からない」と言う。',
      mean: '自分の手土産が危ないかもしれないと、本人が言ってしまうのが笑い。',
      trap: 'sun が耳に残ると天気の話と取りやすい。my car の my で、誰の持ち物の話かが決まる。',
      use: 'Just in case. You never know.（念のためね、何があるか分からないし）' },

    // R fix: V1/V2 (blind 85 %, right): the stem gave "car and the sun", and with a salad that's common sense. The stem
    //   now names the moment, so the car, the sun and the mayonnaise have to be heard.
    // why: why it's warm ← "sitting… sun" heard as an excuse for the temperature; how long he spent ← "all day" heard
    //   as effort
    { id: 'i3', skill: 'infer', level: 'C1', point: 'mayo', seg: [119.95, 129.9],
      stem: 'After “until the guests get here”, why does he add more?',
      choices: ['To hint the salad may have gone off', 'To explain why the salad is warm',
                'To show how long he spent on it'], a: 0,
      cue: '「all day」のあと、何に日が照っていたか。',
      line: 'It’s been sitting in my car *all day*. The sun beating down on the *mayonnaise*.',
      said: '「一日じゅう車に置いてあった。マヨネーズに日が照りつけて」と言う。',
      mean: '暑い車の中のマヨネーズ ＝ 傷んでいるかも。はっきり言わずに伝えている。',
      trap: 'all day を手間、sun を温度の話と取りやすい。マヨネーズと日差しの組み合わせに注目。',
      use: 'It’s been in the fridge for a week.（冷蔵庫に1週間入ってた）' },
  ]
};
