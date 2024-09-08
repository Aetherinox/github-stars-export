<template>
  <v-app dark>
  <v-card flat>
    <v-toolbar
      style="background-color: #262626;"
      :height="`${$vuetify.breakpoint.xsOnly ? 70 : 64}`"
      dark
      flat>
      <template v-if="starredRepos.length > 0">
        <transition name="slide-x-transition">
          <v-layout
            :justify-space-between="$vuetify.breakpoint.xsOnly"
            :justify-center="$vuetify.breakpoint.smAndUp"
            align-center
            class="sort-container">
            <v-menu v-if="$vuetify.breakpoint.xsOnly" transition="slide-y-transition" bottom>
              <v-btn
                slot="activator"
                class="btn-export icon--color"
                color="white">
                Export to...
              </v-btn>
              <v-list>
                <v-list-tile @click="exportToHTML(starredRepos, username)">
                  <v-list-tile-title>
                    <v-layout justify-space-between>
                      HTML
                    <img src="@/assets/html.svg" alt="HTML Logo">
                    </v-layout>
                  </v-list-tile-title>
                </v-list-tile>
                <v-list-tile @click="exportToJSON(starredRepos, username)">
                  <v-list-tile-title>
                    <v-layout justify-space-between>
                      JSON
                    <img src="@/assets/json.svg" alt="JSON logo">
                    </v-layout>
                  </v-list-tile-title>
                </v-list-tile>
              </v-list>
            </v-menu>

            <div>
              <v-btn-toggle>
                <v-btn title="Reverse" @click="sortReverse = !sortReverse" flat>
                  <v-icon>history</v-icon>
                </v-btn>
              </v-btn-toggle>

              <v-btn-toggle>
                <v-btn title="Sort by language" @click="sortLang = !sortLang" flat>
                  <v-icon>code</v-icon>
                </v-btn>
              </v-btn-toggle>

              <v-btn-toggle v-model="sortStars">
                <v-btn title="Sort by stars ASC" flat>
                  <v-icon>arrow_drop_up</v-icon>
                </v-btn>
                <v-btn title="Sort by stars DESC" flat>
                  <v-icon>arrow_drop_down</v-icon>
                </v-btn>
              </v-btn-toggle>
            </div>
          </v-layout>
        </transition>
      </template>
    </v-toolbar>

    <v-layout row pb-5>
      <v-flex xs10 offset-xs1 md8 offset-md2 xl6 offset-xl3>
        <v-card class="card--flex-toolbar">
          <v-toolbar card prominent>

            <v-layout row wrap>
              <v-text-field
                v-model="username"
                @keydown.enter="fetchStarredRepos"
                label="Enter a GitHub username..."
                append-icon="search"
                @click:append="fetchStarredRepos"
                solo>
              </v-text-field>
              <v-menu
                v-if="!$vuetify.breakpoint.xsOnly"
                transition="slide-y-transition"
                bottom>
                <v-btn
                  slot="activator"
                  class="btn-export"
                  dark>
                  Export to...
                </v-btn>
                <v-list>
                  <template v-if="starredRepos.length > 0">
                    <v-list-tile @click="exportToHTML(starredRepos, username)">
                      <v-list-tile-title>
                        <v-layout justify-space-between>
                          HTML
                        <img src="@/assets/html.svg" alt="HTML Logo">
                        </v-layout>
                      </v-list-tile-title>
                    </v-list-tile>
                    <v-list-tile @click="exportToJSON(starredRepos, username)">
                      <v-list-tile-title>
                        <v-layout justify-space-between>
                          JSON
                        <img src="@/assets/json.svg" alt="JSON logo">
                        </v-layout>
                      </v-list-tile-title>
                    </v-list-tile>
                  </template>
                  <v-list-tile v-else>
                    <v-list-tile-title>
                      <v-layout justify-center>
                        No repos found
                      </v-layout>
                    </v-list-tile-title>
                  </v-list-tile>
                </v-list>
              </v-menu>
            </v-layout>

          </v-toolbar>

          <v-divider></v-divider>

          <v-card-text>

            <template v-if="!error && starredRepos.length === 0">
              <no-data v-if="username.length === 0"></no-data>
              <h3 v-else-if="username.length > 0" class="text-xs-center font-weight-regular">Type enter to search for : <b>{{ username }}</b></h3>
            </template>

            <error v-if="error && starredRepos.length === 0" :error="error"></error>

            <template v-if="starredRepos.length > 0">
              <v-layout wrap :justify-space-between="$vuetify.breakpoint.smAndUp" :justify-center="$vuetify.breakpoint.xsOnly">
                <v-subheader>
                  {{ starredRepos.length }} repositories found
                </v-subheader>

                <v-subheader>
                 Page : {{ page }} / {{ lastPage || 1 }}
                 <v-progress-circular
                  v-if="loading"
                  class="ml-2"
                  size="16"
                  :width="2"
                  indeterminate
                  color="primary">
                </v-progress-circular>
                <v-icon v-else class="ml-2">check</v-icon>
                </v-subheader>
              </v-layout>

              <stars-sorted
                :sort="sortStars"
                :reversed="sortReverse"
                :lang="sortLang"
                :repos="starredRepos">
              </stars-sorted>
            </template>

          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-card>
  </v-app>
</template>

<script>
import axios from 'axios'
import linkParser from '@flowbox/parse-link-header'

import StarsSorted from '@/components/Stars/StarsSorted'
import NoData from '@/components/Status/NoData'
import Error from '@/components/Status/Error'

import exportToHTML from '@/exports/html'
import exportToJSON from '@/exports/json'

export default {
  name: 'Main',
  components: {
    StarsSorted,
    NoData,
    Error
  },
  data () {
    return {
      username: '',
      page: 0,
      lastPage: 1,
      loading: false,
      starredRepos: [],
      error: null,
      sortStars: null,
      sortReverse: false,
      sortLang: false
    }
  },
  methods: {
    async fetchStarredRepos () {
      if (this.page > 0) return
      try {
        this.loading = true
        const url = `https://api.github.com/users/${this.username}/starred?per_page=100&page=1`
        // Fetch the first page
        const response = await axios.get(url)
        // If there is an another page, set values
        if (response.headers.link) {
          const { url: nextUrl } = linkParser(response.headers.link).next
          const { page: lastPage } = linkParser(response.headers.link).last
          this.lastPage = parseInt(lastPage)
          this.fetchNextPage(nextUrl)
        }
        // Add result to starredRepos
        this.updateStarredRepos(response.data)
        // Check if there is an another page
      } catch (error) {
        this.error = error
      }
    },
    async fetchNextPage (nextUrl) {
      // More pages, so fetch this page and add the result to the view
      const response = await axios.get(nextUrl)
      // Add the repos in starredRepos
      this.updateStarredRepos(response.data)
      // Check if there is an another page
      if (response.headers.link) {
        // There is an another page
        const { url: anotherPage } = linkParser(response.headers.link).next
        if (anotherPage) {
          this.fetchNextPage(anotherPage)
        }
      }
    },
    updateStarredRepos (newStarredRepos) {
      this.page++
      const newRepos = newStarredRepos.map(star => ({
        full_name: star.full_name,
        name: star.name,
        description: star.description,
        topics: star.topics,
        html_url: star.html_url,
        homepage: star.homepage,
        lang: star.language,
        created: star.created_at,
        last_push: star.pushed_at,
        last_update: star.updated_at,
        forked: star.fork,
        archived: star.archived,
        template: star.is_template,
        owner: star.owner.login,
        owner_url: star.owner.html_url,
        owner_img: star.owner.avatar_url,
        owner_type: star.owner.type,
        stars: star.stargazers_count
      }))
      this.starredRepos = [...this.starredRepos, ...newRepos]
      if (this.lastPage === this.page) {
        this.loading = false
      }
    },
    exportToHTML,
    exportToJSON
  },
  watch: {
    username () {
      this.starredRepos = []
      this.page = 0
      this.lastPage = 1
      this.error = null
    }
  }
}
</script>

<style>

  .v-btn__content img, .v-toolbar__title img {
    filter: invert(1) brightness(100%);
  }

  .theme--dark.v-footer {
    color: #fff;
    background-color: #0f0f0f !important;
  }

  .theme--dark.application {
      background: #0F0F0F;
      color: #fff;
  }

  .theme--dark.v-sheet {
      background-color: #262626;
      border-color: #424242;
      color: #fff;
  }

  .v-toolbar--card .v-toolbar__content {
    background-color: #1c1c1c;
    height: 85px !important;
  }

  .theme--dark.v-btn:not(.v-btn--icon):not(.v-btn--flat) {
    background-color: #375397;
  }

  .v-card.v-card--flat.v-sheet.theme--dark {
    padding-top: 40px;
  }

  .v-card__text {
    background-color: #151515;
  }

  .v-toolbar.theme--dark {
    background-color: #0f0f0f;
  }

  .theme--dark.v-toolbar {
    background-color: none;
  }

  .btn-top {
    position: fixed !important;
    bottom: 64px !important;
    right: 16px !important;
    background-color: #0A519D !important;
    color: #FFF !important;
  }

  .sort-container {
    max-height: 36px;
  }

  .card--flex-toolbar {
    margin-top: -64px;
  }

  .v-input__slot {
    margin-bottom: 0;
  }

  .ml-1 {
    margin-left: 4px !important;
    color: #FBA93F !important;
  }

  .btn-export:not(.icon--color) {
    height: 48px;
    margin: 0;
  }

  .theme--dark.v-list {
    background: #262626;
    color: #fff;
  }

  .v-list__tile__title img {
    height: 24px;
    width: 24px;
  }

  .reversed {
    filter: brightness(50%);
  }

  .v-btn-toggle {
    margin: 0 4px;
  }

</style>
