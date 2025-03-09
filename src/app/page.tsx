import styles from './page.module.css';
import { PrismaClient } from '@prisma/client';

async function getData() {
  const prisma = new PrismaClient();

  try {
    // Fetch alphas with their users
    const alphas = await prisma.alpha.findMany({
      include: {
        users: true,
      },
    });

    // Fetch scrapers
    const scrapers = await prisma.scraper.findMany({
      orderBy: {
        startTime: 'desc',
      },
    });

    return { alphas, scrapers };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error('Failed to fetch data');
  } finally {
    await prisma.$disconnect();
  }
}

// Format date for display
const formatDate = (date: Date | null | undefined) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

// Add this export to prevent caching
export const dynamic = 'force-dynamic';

export default async function Home() {
  const { alphas, scrapers } = await getData();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Alpha Users</h1>
        {alphas.length > 0 ? (
          <div className={styles.tableContainer}>
            {alphas.map((alpha) => (
              <div key={alpha.id} className={styles.alphaSection}>
                <h2>{alpha.name}</h2>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Twitter ID</th>
                      <th>Twitter Name</th>
                      <th>Twitter User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alpha.users.length > 0 ? (
                      alpha.users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.twitterId}</td>
                          <td>{user.twitterName}</td>
                          <td>{user.twitterUser}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>No users found for this alpha</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <p>No alphas found</p>
        )}

        <h1>Scrapers</h1>
        {scrapers.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Resume Time</th>
                </tr>
              </thead>
              <tbody>
                {scrapers.map((scraper) => (
                  <tr key={scraper.id}>
                    <td>{scraper.id}</td>
                    <td>{scraper.status}</td>
                    <td>{formatDate(scraper.startTime)}</td>
                    <td>{formatDate(scraper.endTime)}</td>
                    <td>{formatDate(scraper.resumeTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No scrapers found</p>
        )}
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
