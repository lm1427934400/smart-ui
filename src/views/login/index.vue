<template>
  <div class="login-container">
    <!-- Earth background animation -->
    <Earth class="earth-background" />
    <div id="particles-js">
      <vue-particles
        v-if="refreshParticles"
        color="#4dabf7"
        :particle-opacity="0.7"
        :particles-number="60"
        shape-type="circle"
        :particle-size="3"
        lines-color="#4dabf7"
        :lines-width="1"
        :line-linked="true"
        :line-opacity="0.3"
        :lines-distance="120"
        :move-speed="2"
        :hover-effect="true"
        hover-mode="grab"
        :click-effect="true"
        click-mode="push"
      />
    </div>

    <!-- Login card overlay -->
    <div class="login-overlay">
      <div class="login-weaper animated bounceInDown">
        <div class="login-border">
          <div class="login-main">
            <div class="login-title">用户登录</div>
            <el-form
              ref="loginForm"
              :model="loginForm"
              :rules="loginRules"
              class="login-form"
              autocomplete="on"
              label-position="left"
            >
              <el-form-item prop="username" class="login-form-item">
                <div class="input-wrapper">
                  <span class="svg-container">
                    <i class="el-icon-user" />
                  </span>
                  <el-input
                    ref="username"
                    v-model="loginForm.username"
                    placeholder="用户名"
                    name="username"
                    type="text"
                    tabindex="1"
                    autocomplete="on"
                    class="custom-input"
                  />
                </div>
              </el-form-item>

              <el-tooltip
                v-model="capsTooltip"
                content="Caps lock is On"
                placement="right"
                manual
              >
                <el-form-item prop="password" class="login-form-item">
                  <div class="input-wrapper">
                    <span class="svg-container">
                      <svg-icon icon-class="password" />
                    </span>
                    <el-input
                      :key="passwordType"
                      ref="password"
                      v-model="loginForm.password"
                      :type="passwordType"
                      placeholder="密码"
                      name="password"
                      tabindex="2"
                      autocomplete="on"
                      @keyup.native="checkCapslock"
                      @blur="capsTooltip = false"
                      @keyup.enter.native="handleLogin"
                      class="custom-input"
                    />
                    <span class="show-pwd" @click="showPwd">
                      <svg-icon
                        :icon-class="
                          passwordType === 'password' ? 'eye' : 'eye-open'
                        "
                      />
                    </span>
                  </div>
                </el-form-item>
              </el-tooltip>
              <div class="captcha-container">
                <el-form-item prop="code" class="captcha-input login-form-item">
                  <div class="input-wrapper">
                    <span class="svg-container">
                      <svg-icon icon-class="validCode" />
                    </span>
                    <el-input
                      ref="username"
                      v-model="loginForm.code"
                      placeholder="验证码"
                      name="username"
                      type="text"
                      tabindex="3"
                      maxlength="5"
                      autocomplete="off"
                      class="custom-input"
                      @keyup.enter.native="handleLogin"
                    />
                  </div>
                </el-form-item>
                <div class="login-code">
                  <img
                    :src="codeUrl"
                    @click="getCode"
                  />
                </div>
              </div>

              <el-button
                :loading="loading"
                type="primary"
                style="width: 100%; padding: 12px 20px; margin-bottom: 30px; background: linear-gradient(45deg, #4dabf7, #3bc9db); border: none; font-weight: 600"
                @click.native.prevent="handleLogin"
              >
                <span v-if="!loading">{{ useLdap ? '使用LDAP账号登陆' : '登陆' }}</span>
                <span v-else>登 录 中...</span>
              </el-button>
              <span @click="toggleLoginMethod" style="cursor: pointer; color: #4dabf7; padding: 12px 50px; margin-bottom: 20px; display: block; text-align: center">
                {{ useLdap ? 'Use local user account to login' : '   Use LDAP account to login' }}
              </span>
            </el-form>
          </div>
        </div>
      </div>
    </div>

    <el-dialog title="Or connect with" :visible.sync="showDialog" :close-on-click-modal="false">
      Can not be simulated on local, so please combine you own business
      simulation! ! !
      <br>
      <br>
      <br>
      <social-sign />
    </el-dialog>
    <div
      id="bottom_layer"
      class="s-bottom-layer s-isindex-wrap"
      style="visibility: visible; width: 100%"
    >
      <div class="s-bottom-layer-content">
        <div class="lh">
          <a class="text-color" href="https://beian.miit.gov.cn" target="_blank">
            沪ICP备XXXXXXXXX号-1
          </a>
        </div>
        <div class="open-content-info">
          <div class="tip-hover-panel" style="top: -18px; right: -12px">
            <div class="rest_info_tip">
              <div class="tip-wrapper">
                <div class="lh tip-item" style="display: none">
                  <a
                    class="text-color"
                    href="https://beian.miit.gov.cn"
                    target="_blank"
                  >
                    沪ICP备XXXXXXXXX号-1
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getCodeImg } from '@/api/login'
import moment from 'moment'
import SocialSign from './components/SocialSignin'
import Earth from '@/components/Earth/Index.vue'

export default {
  name: 'Login',
  components: { SocialSign, Earth },
  data() {
    return {
      // logo: require('@/views/login/logo.png'),
      useLdap: false, // 初始为 true，表示使用LDAP用户登陆
      codeUrl: '',
      cookiePassword: '',
      refreshParticles: true,
      loginForm: {
        username: 'admin',
        password: '123456',
        rememberMe: false,
        source: 'SYSTEM',
        code: '',
        uuid: ''
      },
      loginRules: {
        username: [
          { required: true, trigger: 'blur', message: '用户名不能为空' }
        ],
        password: [
          { required: true, trigger: 'blur', message: '密码不能为空' }
        ],
        code: [
          { required: true, trigger: 'change', message: '验证码不能为空' }
        ]
      },
      passwordType: 'password',
      capsTooltip: false,
      loading: false,
      showDialog: false,
      redirect: undefined,
      otherQuery: {},
      currentTime: null,
      sysInfo: ''
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        const query = route.query
        if (query) {
          this.redirect = query.redirect
          this.otherQuery = this.getOtherQuery(query)
        }
      },
      immediate: true
    }
  },
  created() {
    this.getCode()
    // window.addEventListener('storage', this.afterQRScan)
    this.getCurrentTime()
    this.getSystemSetting()
  },
  mounted() {
    if (this.loginForm.username === '') {
      this.$refs.username.focus()
    } else if (this.loginForm.password === '') {
      this.$refs.password.focus()
    }
    window.addEventListener('resize', () => {
      this.refreshParticles = false
      this.$nextTick(() => (this.refreshParticles = true))
    })
  },
  destroyed() {
    clearInterval(this.timer)
    window.removeEventListener('resize', () => {})
  },
  methods: {
    toggleLoginMethod() {
      this.useLdap = !this.useLdap;
      if (this.useLdap) {
        this.loginForm.source = 'LDAP'
      } else {
        this.loginForm.source = 'SYSTEM'
      }
    },
    getSystemSetting() {
      this.$store.dispatch('system/settingDetail').then((ret) => {
        this.sysInfo = ret
        document.title = ret.sys_app_name
      })
    },
    getCurrentTime() {
      this.timer = setInterval((_) => {
        this.currentTime = moment().format('YYYY-MM-DD HH时mm分ss秒')
      }, 1000)
    },
    getCode() {
      getCodeImg().then((res) => {
        if (res !== undefined) {
          this.codeUrl = res.data
          this.loginForm.uuid = res.id
        }
      })
    },
    checkCapslock({ shiftKey, key } = {}) {
      if (key && key.length === 1) {
        if (
          (shiftKey && key >= 'a' && key <= 'z') ||
          (!shiftKey && key >= 'A' && key <= 'Z')
        ) {
          this.capsTooltip = true
        } else {
          this.capsTooltip = false
        }
      }
      if (key === 'CapsLock' && this.capsTooltip === true) {
        this.capsTooltip = false
      }
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.loading = true;

          // 判断使用哪种登录方式
          const loginAction = this.useLdap ? 'user/ldapLogin' : 'user/login'

          this.$store.dispatch(loginAction, this.loginForm).then(() => {

            // 获取用户名
            const username = this.loginForm.username;

            // 显示欢迎提示
            this.$message({
              message: `欢迎 ${username}登陆系统`,
              type: 'success'
            });

            this.$router.push({ path: this.redirect || '/', query: this.otherQuery }).catch(() => {})
          }).catch(() => {
            this.loading = false;
            this.getCode(); // 如果你使用验证码
          });
        } else {
          console.log('Error: Form validation failed!');
          return false;
        }
      });
    },
    getOtherQuery(query) {
      return Object.keys(query).reduce((acc, cur) => {
        if (cur !== 'redirect') {
          acc[cur] = query[cur]
        }
        return acc
      }, {})
    }
  }
}
</script>

<style lang="scss" scoped>
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg: #283443;
$light_gray: #fff;
$cursor: #fff;

#bottom_layer {
  visibility: hidden;
  width: 3000px;
  position: fixed;
  z-index: 302;
  bottom: 0;
  left: 0;
  height: 39px;
  padding-top: 1px;
  zoom: 1;
  margin: 0;
  line-height: 39px;

}

#bottom_layer .lh {
  display: inline-block;
  margin-right: 14px;

}

#bottom_layer .lh .emphasize {
  text-decoration: underline;
  font-weight: 700;

}

#bottom_layer .lh:last-child {
  margin-left: -2px;
  margin-right: 0;

}

#bottom_layer .lh.activity {
  font-weight: 700;
  text-decoration: underline;

}

#bottom_layer a {
  font-size: 12px;
  text-decoration: none;

}

#bottom_layer .text-color {
  color: #bbb;

}

#bottom_layer .aria-img {
  width: 49px;
  height: 20px;
  margin-bottom: -5px;

}

#bottom_layer a:hover {
  color: #fff;

}

#bottom_layer .s-bottom-layer-content {
  margin: 0 17px;
  text-align: center;

}

#bottom_layer .s-bottom-layer-content .auto-transform-line {
  display: inline;

}

#bottom_layer .s-bottom-layer-content .auto-transform-line:first-child {
  margin-right: 14px;

}

.s-bottom-space {
  position: static;
  width: 100%;
  height: 40px;
  margin: 23px auto 12px;

}

#bottom_layer .open-content-info a:hover {
  color: #fff;

}

#bottom_layer .open-content-info .text-color {
  color: #626675;

}

.open-content-info {
  position: relative;
  display: inline-block;
  width: 20px;

}

.open-content-info > span {
  cursor: pointer;
  font-size: 14px;

}

.open-content-info > span:hover {
  color: #fff;

}

.open-content-info .tip-hover-panel {
  position: absolute;
  display: none;
  padding-bottom: 18px;

}

.open-content-info .tip-hover-panel .rest_info_tip {
  max-width: 560px;
  padding: 8px 12px 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  text-align: left;

}

.open-content-info .tip-hover-panel .rest_info_tip .tip-wrapper {
  white-space: nowrap;
  line-height: 20px;

}

.open-content-info .tip-hover-panel .rest_info_tip .tip-wrapper .tip-item {
  height: 20px;
  line-height: 20px;

}

.open-content-info
  .tip-hover-panel
  .rest_info_tip
  .tip-wrapper
  .tip-item:last-child {
  margin-right: 0;

}

@media screen and (max-width: 515px) {
  .open-content-info {
    width: 16px;

  }
  .open-content-info .tip-hover-panel {
    right: -16px !important;

  }
}

.login-container {
  display: flex;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  background: linear-gradient(135deg, #0f172a, #1e3a8a);
  position: relative;
  background-size: cover;
  height: 100vh;
  background-position: 50%;
  overflow: hidden;
}

.earth-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

#particles-js {
  z-index: 2;
  width: 100%;
  height: 100%;
  position: absolute;
}

.login-overlay {
  position: relative;
  z-index: 1000;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: flex-end; /* Align to right side */
  padding-right: calc(33.33% / 2); /* Center in the right 1/3 */
}

.login-weaper {
  width: 350px; /* Fixed width for the login card */
}

.login-border {
  padding: 40px 30px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
}

.login-main {
  width: 100%;
}

.login-title {
  color: #fff;
  margin-bottom: 40px;
  font-weight: 600;
  font-size: 28px;
  text-align: center;
  letter-spacing: 4px;
  text-shadow: 0 0 10px rgba(77, 171, 247, 0.7);
}

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;

  }
}

.login-form-item {
  margin-bottom: 22px !important;
}

.input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
}

.input-wrapper:hover {
  border: 1px solid rgba(77, 171, 247, 0.5);
  box-shadow: 0 0 10px rgba(77, 171, 247, 0.3);
}

.svg-container {
  padding: 6px 5px 6px 15px;
  color: rgba(0, 0, 0, 0.7);
  width: 40px; /* Fixed width for alignment */
  display: flex;
  align-items: center;
  justify-content: center;
  height: 47px;
}

.custom-input {
  flex: 1;
}

.custom-input ::v-deep input {
  color: #000 !important;
  height: 47px;
  background: #fff !important; /* Ensure white background */
  border: 0px;
  -webkit-appearance: none;
  border-radius: 0px;
  padding: 12px 5px 12px 15px;
  caret-color: #000;
  font-size: 16px;
}

.custom-input ::v-deep input::placeholder {
  color: rgba(0, 0, 0, 0.7) !important;
}

.captcha-container {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  margin-bottom: 22px;
}

.captcha-input {
  flex: 1;
  margin-bottom: 0 !important;
}

.captcha-input ::v-deep .input-wrapper {
  background: #fff; /* White background for captcha input */
}

.login-code {
  cursor: pointer;
  width: 30%;
  height: 48px;
  background-color: #fff;
  border-radius: 5px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-code img {
  height: 48px;
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

.show-pwd {
  position: absolute;
  right: 10px;
  top: 0;
  height: 47px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  user-select: none;
}

/* reset element-ui css */
.login-container {
  ::v-deep .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;
  }

  .el-form-item {
    border: none;
    background: transparent;
    border-radius: 0;
    margin-bottom: 0;
  }
  
  .el-form-item__content {
    line-height: normal;
  }
}

$bg: #2d3a4b;
$dark_gray: #889aa4;
$light_gray: #eee;

.login-container {
  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: rgba(0, 0, 0, 0.7); /* Changed to darker color */
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: rgba(0, 0, 0, 0.7);
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .thirdparty-button {
    position: absolute;
    right: 0;
    bottom: 6px;
  }

  @media only screen and (max-width: 470px) {
    .thirdparty-button {
      display: none;
    }
    .login-weaper {
      width: 100%;
      padding: 0 30px;
      box-sizing: border-box;
      box-shadow: none;
    }
    .login-main {
      width: 80%;
    }
    .login-left {
      display: none !important;
    }
    .login-border {
      width: 100%;
    }
  }
}
</style>