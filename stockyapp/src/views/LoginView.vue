<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authMessage, useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const mode = ref('login') // 'login' | 'signup'
const email = ref('')
const password = ref('')
const confirm = ref('')
const busy = ref(false)
const error = ref('')
const info = ref('')

const isSignup = computed(() => mode.value === 'signup')

function switchMode() {
  mode.value = isSignup.value ? 'login' : 'signup'
  error.value = ''
  info.value = ''
}

async function run(fn) {
  busy.value = true
  error.value = ''
  info.value = ''
  try {
    await fn()
    router.replace({ name: 'diary' })
  } catch (e) {
    error.value = authMessage(e)
  } finally {
    busy.value = false
  }
}

function submit() {
  if (isSignup.value && password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  run(() =>
    isSignup.value
      ? auth.signUp(email.value.trim(), password.value)
      : auth.signIn(email.value.trim(), password.value),
  )
}

async function forgot() {
  error.value = ''
  info.value = ''
  if (!email.value.trim()) {
    error.value = 'Enter your email above first.'
    return
  }
  busy.value = true
  try {
    await auth.resetPassword(email.value.trim())
    info.value = 'Password reset email sent. Check your inbox.'
  } catch (e) {
    error.value = authMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="flex min-h-dvh flex-col justify-center px-6 py-10">
    <h1 class="text-3xl font-bold text-green-800">Stocky</h1>
    <p class="mt-1 text-slate-600">Track your daily calories.</p>

    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <h2 class="text-xl font-semibold">{{ isSignup ? 'Create account' : 'Log in' }}</h2>

      <div>
        <label class="label" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          class="input"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
        />
      </div>
      <div>
        <label class="label" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          class="input"
          type="password"
          :autocomplete="isSignup ? 'new-password' : 'current-password'"
          minlength="6"
          required
        />
      </div>
      <div v-if="isSignup">
        <label class="label" for="confirm">Confirm password</label>
        <input
          id="confirm"
          v-model="confirm"
          class="input"
          type="password"
          autocomplete="new-password"
          required
        />
      </div>

      <p v-if="error" class="error-text" role="alert">{{ error }}</p>
      <p v-if="info" class="text-sm text-green-800" role="status">{{ info }}</p>

      <button class="btn btn-primary w-full" type="submit" :disabled="busy">
        {{ isSignup ? 'Sign up' : 'Log in' }}
      </button>
      <button
        v-if="!isSignup"
        class="btn-ghost w-full text-center"
        type="button"
        :disabled="busy"
        @click="forgot"
      >
        Forgot password?
      </button>
    </form>

    <div class="my-5 flex items-center gap-3 text-sm text-slate-500">
      <span class="h-px flex-1 bg-slate-300"></span>or<span class="h-px flex-1 bg-slate-300"></span>
    </div>

    <button
      class="btn btn-secondary w-full"
      type="button"
      :disabled="busy"
      @click="run(() => auth.signInWithGoogle())"
    >
      Continue with Google
    </button>

    <button class="btn-ghost mt-6 w-full text-center" type="button" @click="switchMode">
      {{ isSignup ? 'Already have an account? Log in' : 'New here? Create an account' }}
    </button>
  </main>
</template>
