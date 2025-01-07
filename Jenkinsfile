pipeline {
    agent any
    options {
        timeout(time: 10, unit: 'MINUTES')
    }

    //tools {
    //    nodejs 'nodejs-20.18.0'
    //}

    environment {
      BRANCH_NAME = "${GIT_BRANCH.split('/').size() > 1 ? GIT_BRANCH.split('/')[1..-1].join('/') : GIT_BRANCH}".replace('/', '-')
    }

    stages {
        stage('Pipeline') {
           parallel {
                stage ('install') {
                    agent any
                    steps {
                        // echo current branch
                        sh "echo 'Current branch is: ${env.BRANCH_NAME}'"
                        sh "docker build --tag=registry.digitalocean.com/healthpay-monorepo/monorepo-prod:latest . && docker push registry.digitalocean.com/healthpay-monorepo/monorepo-prod:latest"
                    }
                }
           }

        }
    }
}
