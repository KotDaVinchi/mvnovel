# Документация на язык сценариев MVNovel 1.0

## Как строится сюжет

Сюжет состоит из череды состояний, который описывают то что происходит на экране в момент когда состояние активно.\
Состояния разделяются между собой пустой строкой
В самом первом состоянии так-же необходимо прописать общие для все истории вещи, такие как название истории, описание и т.д.

Все индентификаторы, описаные ниже, должны состоять только из русских и английских букв и цифр.


## Управляющие конструкции для всей истории:
*круглые скобки показаны для описания формата и не используются в управляющих конструкциях

%названиеИстории, %storyTitle - название истории\
Формат: `%названиеИстории (Название с пробелами)`
```
%названиеИстории Обратная сторона любви
```
%описаниеИстории, %description - описание истории.\
Формат: `%описаниеИстории (Описание с пробелами)`
```
%описаниеИстории В этой истории вам предстоит переход в новую школу. Окунитесь в романтику новых отношений, найдите друзей и встретьте свою любовь.
```
%раса, %nation - добавление файов рассы главного персонажа.\
Формат: `%раса (названиеФайлаРассыБезПробелов)`
```
%раса white.png
%раса black.png
```
%причёска, %hair - добавление файлов причёски и их описания для главного персонажа.\
Формат: `%причёска (названиеФайлаБезПробелов) (название причёски с пробелами)`
```
%причёска redShort.png Короткие красные волосы
%причёска blackLong.png Длинные чёрные волосы
```
%наряд, %clothes - добавление файлов одежды, тегов и описание одежды для главного персонажа. Теги содержатся в квадратных скобках.\
Формат: `%причёска (названиеФайлаБезПробелов) [(список тегов через пробелы)] (название одежды с пробелами)`
```
%наряд smallBlackDress.png [party night] Маленькое чёрное платье
%наряд schoolDress.png [casual] Школьная форма
```
%перс, %char - добавление персонажа, его индентификатора, имени и информации о знакомстве.\
Если нужно сразу показывать имя персонажа, т.е. персонаж знаком с ним заранее, то в конце конструкции нужно написать `default`
Индентификатор главного героя объявлять не нужно.
Формат: `%перс (индентификаторБезПробелов) (ИмяБезПробелов) (default)`
```
%перс musician Джон
%перс mom Мама default
%перс
```
%чекпоинтИмя, %checkpointName - имя чекпоинта
Формат: `%чекпоинтИмя (индентификаторБезПробелов) (Имя чекпоинта с пробелами)`
```
%чекпоинтИмя 1episode Первый эпизод
%чекпоинтИмя 2episode Второй эпизод
```

##Управляющие конструкции для состояния:
Реплика или обычный текст пишутся без управляющих конструкций

%имя, %name - индентификатор персонажа, который говорит реплику в этой фразе\
Индентификатор главного героя - "me".
Формат: `%имя (индентификаторПерсонажаБезПробелов)`
```
%имя me
Уф, как сложно.

%имя mom
Не всё так страшно, дорогая.
```
%фон, %bcg - название фона\
Формат: `%фон (названиеФайлаФонаБезПробелов)`
```
%фон house.jpg
%имя me
Уф, как сложно.
```
%спрайт, %sprite - название спрайта персонажа(index - стандартный спрайт)\
Формат: `%фон (названиеФайлаСпрайтаБезПробелов)`
```
%имя musician
%спрайт suit
Как тебе мой костюм?
```
%действие, %action - действие(см. действия)\
Формат: `%действие (названиеДействия) (дополнительные сведения)`
```
%имя musician
%спрайт suit
%action introduce
Меня зовут Джон, приятно познакомится
```
%звук, %sound - имя файла звуковой дорожки\
Формат: `%звук (названиеФайлаЗвуковБезПробелов)`
```
%имя mom
%звук worry.mp3
Мне нужно серьёзно с тобой поговорить!
```
%спец, %spec - специальное состояние(см. специальные состояния)\
Формат: `%спец (названиеСостоянияБезПробелов)`
```
%спец chooseNation
```
%чекпоинт, %checkpoint - Состояние на котором ставим чекпоинт\
Формат: `%чекпоинт (индентификаторЧекпоинта)`
```
%имя me
Новый день - новые проблемы!
%чекпоинт 2episode
```
%ид, %id - айди состояния, на которое в дальнейшем можно переключаться\
Формат: `%ид (индентификаторСостояния)`
```
%имя me
%ид agree
Да, хочу!
```
%вариант, %option - Кнопка, которая позволяет выбрать один из вариантов см. Условия перехода\
Формат: `%вариант (индентификаторСостояния) ({ Описание цены, можно не писать }) (Текст кнопки с пробелами)`
```
%имя musician
Хош мороженку?
%option agree Согласиться
%option disagree {"resource": "diamonds", "count": 10} Отказаться 
```
%дальше, %next - айди следующего состояния см. Условия перехода\
Если не указано, то игра переходит к следующему по списку
```
%имя me
%ид disagree
Не, спасибо
%дальше somethingElse
```
%сцена, %scene - дополнительная информация сцены.
Формат: `%сцена {"filter": "casual"}`

## Специальные состояние

В игре присутствует несколько специальных состояний:
"episodeTitle" - Текст, написаный большими буквами, используется для написания заголовков эпизодов

"chooseNation" - выбор расы у гг

"chooseLook" - выбор внешнего вида у гг

"enterName" - выбор имени гг

## Действия

Действия позволяют записывать переменные в память а потом с ними что-то делать. Или оно само происходит

"introduce" - Если персонаж не отмечен как знакомый, вместо его имени пишется три точки.\
При знакомстве нужно написать это действие, чтобы его имя начало отображаться.\
Можно дописать индентификатор персонажа чтобы знакомство было с другим персонажем

```
%действие introduce
%действие introduce musician
```

"set" - установка значения переменной.
```
%действие set имяПеременной значение
%действие set hasFight true
```

## Условия перехода
Можно опираться на значения переменных и указывать несколько точек перехода.

Условие выглядит как `#дальше = (названиеПеременной) (предпологаемоеЗначение) (кудаПерейтиВСлучаеРавенстваСПредпологаемымЗначением)`
Можно писать несколько условий подряд.
Так-же рекомендуется в конце списка условий рекомендуется писать переход без условий. Он произойдёт только в случае, если все прошлые условия этого состояния не выполнятся. `#дальше (индентификаторКудаПерейтиДальше)`

Например, в сюжете может произойти драка или нет. В дальнейшем поменяется диалог если драка была.\
Если драка происходит, то в состоянии, где драка мы создаём переменную hasFight и пишем туда true.\
В дальнейшем мы проверяем есть ли переменная с таким значением и в зависимости от этого разветвляем сюжет.

```
%имя me
Я тебя уделаю!
%действие set hasFight true

Вы наносите удар Джеку в ухо!
```
```
Вы встречаете Джека
#дальше = hasFight true badReaction
#дальше goodReaction

#ид badReaction
Ну привет. Как ухо? Не болит?
#дальше exitReaction

#ид goodReaction
О, привет, как дела?
#дальше exitReaction

#ид exitReaction
В любом случае, меня попросили передать тебе эти документы.
```

В данном примере мы разветвляем диалог на 2 варианта goodReaction и badReaction, после чего сводим в одну ветку, которая начинается с exitReaction.
