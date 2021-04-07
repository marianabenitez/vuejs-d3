import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '@/components/Home.vue'
import Line from '@/components/Line.vue'
import OrgChart from '@/components/OrgChart.vue'

Vue.use(VueRouter);

export default new VueRouter({
    routes: [
        {
            component: Home,
            name: 'Home',
            path: '/'
        },
        {
            component: Line,
            name: 'Line',
            path: '/line'
        },
        {
            component: OrgChart,
            name: 'OrgChart',
            path: '/orgchart'
        }
    ]
});