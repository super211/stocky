<script setup>
const features = [
  { title: 'Weight', text: 'Log your weight and see how it changes over time.' },
  { title: 'Sleep', text: 'Record how long and how well you sleep each night.' },
  { title: 'Exercise', text: 'Keep a record of your workouts and daily activity.' },
  { title: 'Nutrition', text: 'Note what you eat and drink to stay on top of your habits.' },
]
</script>

<template>
  <div class="landing">
    <header>
      <img alt="HealthTracker logo" class="logo" src="./assets/logo.svg" width="125" height="125" />
      <div>
        <h1>HealthTracker</h1>
        <p>
          A simple app for logging your daily health metrics and tracking your progress over time.
        </p>
      </div>
    </header>

    <main>
      <ul class="features">
        <li v-for="feature in features" :key="feature.title">
          <h2>{{ feature.title }}</h2>
          <p>{{ feature.text }}</p>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.landing {
  grid-column: 1 / -1;
}

header {
  line-height: 1.5;
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2.4rem;
  font-weight: 500;
  color: var(--color-heading);
}

.logo {
  display: block;
  margin: 0 auto 1rem;
}

.features {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.features li {
  padding: 1rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.features h2 {
  font-size: 1.2rem;
  color: hsla(160, 100%, 37%, 1);
}

@media (min-width: 1024px) {
  header {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: left;
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  .features {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
