import { expect, test, type Page } from '@playwright/test';

/** Answers questions correctly until `done` is visible. Reads the factors from data attributes. */
async function answerUntil(page: Page, done: string) {
  const finished = page.getByTestId(done);
  const deadline = Date.now() + 90_000;
  let answered = 0;
  while (Date.now() < deadline) {
    if (await finished.isVisible()) return answered;
    const question = page.getByTestId('question');
    const answer = page.getByTestId('answer');
    if ((await question.isVisible()) && (await answer.isVisible()) && (await answer.innerText()).trim() === '' && (await page.getByTestId('key-1').isEnabled())) {
      const a = Number(await question.getAttribute('data-a'));
      const b = Number(await question.getAttribute('data-b'));
      await page.keyboard.type(String(a * b));
      await page.keyboard.press('Enter');
      answered++;
    }
    await page.waitForTimeout(80);
  }
  throw new Error(`${done} never appeared`);
}

test('hub → adventure → play level 1 → level 2 unlocked → summary updated', async ({ page }) => {
  // ?fast=1 shortens levels for tests (levelPassMastery = 1, short countdown).
  await page.goto('/?fast=1#/');
  await page.getByTestId('onboarding-skip').click();

  await page.getByTestId('game-multiplication').click();
  await expect(page.getByTestId('menu-progress')).toHaveText('Bölüm 1 / 9');
  await page.getByTestId('menu-adventure').click();

  await expect(page.getByTestId('stop-farm')).toHaveAttribute('data-status', 'locked');
  await page.getByTestId('stop-home').click();
  await page.getByTestId('play-level').click();

  const answered = await answerUntil(page, 'level-complete');
  expect(answered).toBeGreaterThan(0);
  await page.getByTestId('back-to-map').click();

  await expect(page.getByTestId('stop-home')).toHaveAttribute('data-status', 'completed');
  await expect(page.getByTestId('stop-farm')).toHaveAttribute('data-status', 'unlocked', { timeout: 5000 });

  // Progress survives a reload (local storage).
  await page.reload();
  await expect(page.getByTestId('stop-farm')).toHaveAttribute('data-status', 'unlocked');

  await page.goto('/?fast=1#/mult/summary');
  await expect(page.getByTestId('summary-adventure')).toContainText('1 / 9');
  await expect(page.getByTestId('cell-1x7')).not.toHaveAttribute('data-health', 'unseen');
  await expect(page.getByTestId('cell-7x8')).toHaveAttribute('data-health', 'unseen');
});
