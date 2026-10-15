import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { planFor } from '@/utils/nutrition'

const auth = vi.hoisted(() => ({
  profile: null,
  dailyGoal: null,
  user: { email: 'a@b.c' },
  setDailyGoal: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({ useAuthStore: () => auth }))
vi.mock('@/stores/diary', () => ({ useDiaryStore: () => ({ reset: vi.fn() }) }))
vi.mock('@/stores/foods', () => ({ useFoodsStore: () => ({ $reset: vi.fn() }) }))
const theme = vi.hoisted(() => ({ theme: 'system', error: '', setTheme: vi.fn() }))
vi.mock('@/stores/theme', () => ({ useThemeStore: () => theme }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))

import SettingsView from './SettingsView.vue'

const body = { gender: 'female', age: 30, weightLb: 150, heightIn: 65, activity: 'light' }

function setProfile(extra, goal) {
  auth.profile = { ...body, onboarded: true, ...extra }
  auth.dailyGoal = goal
}

beforeEach(() => {
  vi.clearAllMocks()
  theme.theme = 'system'
  theme.error = ''
})

describe('SettingsView appearance', () => {
  it('renders Light, Dark and System with the active one checked', () => {
    theme.theme = 'dark'
    const w = mount(SettingsView)
    const radios = w.findAll('input[name="theme"]')
    expect(radios.map((r) => r.element.value)).toEqual(['light', 'dark', 'system'])
    expect(radios.map((r) => r.element.checked)).toEqual([false, true, false])
    expect(w.find('fieldset legend').text()).toBe('Appearance')
  })

  it('saves the chosen theme', async () => {
    const w = mount(SettingsView)
    await w.findAll('input[name="theme"]')[0].setValue()
    expect(theme.setTheme).toHaveBeenCalledWith('light')
  })

  it('shows a non-blocking error when saving failed', () => {
    theme.error = 'Could not save'
    const w = mount(SettingsView)
    expect(w.find('[role="alert"]').text()).toContain('Could not save')
  })
})

describe('SettingsView plan summary', () => {
  it('shows the weekly plan while the goal still matches it', () => {
    const calories = planFor(body, -1).calories
    setProfile({ weeklyChangeLb: -1 }, calories)
    const text = mount(SettingsView).text()
    expect(text).toContain('Lose 1 lb/week')
    expect(text).toContain(`${calories} kcal/day`)
  })

  it('does not claim a weekly rate when the goal was set manually to something else', () => {
    const calories = planFor(body, -1).calories
    setProfile({ weeklyChangeLb: -1 }, calories + 777)
    const text = mount(SettingsView).text()
    expect(text).not.toContain('Lose 1 lb/week')
    expect(text).toContain('Manual goal')
    expect(text).toContain(`${calories + 777} kcal/day`)
  })
})
