import { Card, CardContent, CardHeader, CardTitle, MoodChart, PageHeader, computeMoodStats } from "@as/ui";
import { getMyDiary } from "../../../lib/data";
import { Diary } from "../../../components/diary";

export default async function DiarioPage() {
  const entries = await getMyDiary();
  const moodPoints = entries.filter((e) => e.mood).map((e) => ({ createdAt: e.createdAt, mood: e.mood! }));
  const stats = computeMoodStats(moodPoints);

  return (
    <>
      <PageHeader
        title="Meu diário"
        subtitle="Um espaço só seu, entre uma sessão e outra — registre como se sente e o que quer conversar."
      />
      {stats && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Sua evolução</CardTitle>
            <span className="text-xs font-bold text-[var(--text-soft)]">{stats.count} registros</span>
          </CardHeader>
          <CardContent>
            <MoodChart points={moodPoints} height={140} />
            <p className="mt-2 text-xs text-[var(--text-soft)]">
              Olhar para o caminho percorrido também faz parte do processo. ❤️
            </p>
          </CardContent>
        </Card>
      )}
      <Diary entries={entries} />
    </>
  );
}
