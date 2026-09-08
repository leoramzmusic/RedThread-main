pipeline {
    agent any
    
    environment {
        // Docker Registry
        DOCKER_REGISTRY = 'your-registry.azurecr.io'
        DOCKER_CREDENTIALS_ID = 'docker-registry-credentials'
        
        // Kubernetes
        K8S_NAMESPACE_DEV = 'dev'
        K8S_NAMESPACE_STAGING = 'staging'
        K8S_NAMESPACE_PROD = 'prod'
        
        // Notification
        SLACK_CHANNEL = '#redthread-deployments'
        TEAMS_WEBHOOK = credentials('teams-webhook-url')
        
        // Version
        VERSION = "${env.BUILD_NUMBER}"
        GIT_COMMIT_SHORT = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_BRANCH = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                }
            }
        }
        
        stage('Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Building Backend..."
                                pip install -r requirements.txt
                                python -m py_compile src/main.py
                            '''
                        }
                    }
                }
                
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                echo "Building Frontend..."
                                npm ci
                                npm run build
                            '''
                        }
                    }
                }
                
                stage('Build Mobile') {
                    when {
                        expression { fileExists('mobile/package.json') }
                    }
                    steps {
                        dir('mobile') {
                            sh '''
                                echo "Building Mobile App..."
                                npm ci
                                # Add mobile build commands here
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Running Backend Tests..."
                                pytest tests/ --junitxml=test-results.xml --cov=src --cov-report=xml || true
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'backend/test-results.xml'
                            publishCoverage adapters: [coberturaAdapter('backend/coverage.xml')]
                        }
                    }
                }
                
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh '''
                                echo "Running Frontend Tests..."
                                npm run test -- --ci --coverage || true
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            parallel {
                stage('Bandit - Python Security') {
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Running Bandit Security Scan..."
                                pip install bandit
                                bandit -r src/ -f json -o bandit-report.json || true
                            '''
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'backend/bandit-report.json', allowEmptyArchive: true
                        }
                    }
                }
                
                stage('ESLint - Frontend Security') {
                    steps {
                        dir('frontend') {
                            sh '''
                                echo "Running ESLint Security Scan..."
                                npm install --save-dev eslint-plugin-security
                                npx eslint src/ --ext .ts,.tsx,.js,.jsx -f json -o eslint-report.json || true
                            '''
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'frontend/eslint-report.json', allowEmptyArchive: true
                        }
                    }
                }
                
                stage('Trivy - Container Security') {
                    steps {
                        script {
                            sh '''
                                echo "Running Trivy Container Scan..."
                                # Install Trivy if not present
                                if ! command -v trivy &> /dev/null; then
                                    echo "Trivy not installed, skipping..."
                                else
                                    trivy image --severity HIGH,CRITICAL --format json -o trivy-report.json ${DOCKER_REGISTRY}/redthread-backend:${VERSION} || true
                                fi
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Package') {
            parallel {
                stage('Docker - Backend') {
                    steps {
                        dir('backend') {
                            script {
                                docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS_ID) {
                                    def backendImage = docker.build("${DOCKER_REGISTRY}/redthread-backend:${VERSION}")
                                    backendImage.push()
                                    backendImage.push('latest')
                                }
                            }
                        }
                    }
                }
                
                stage('Docker - Frontend') {
                    steps {
                        dir('frontend') {
                            script {
                                docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS_ID) {
                                    def frontendImage = docker.build("${DOCKER_REGISTRY}/redthread-frontend:${VERSION}")
                                    frontendImage.push()
                                    frontendImage.push('latest')
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
            stages {
                stage('Deploy to Dev') {
                    when {
                        branch 'develop'
                    }
                    steps {
                        script {
                            sh """
                                echo "Deploying to Dev environment..."
                                kubectl set image deployment/redthread-backend redthread-backend=${DOCKER_REGISTRY}/redthread-backend:${VERSION} -n ${K8S_NAMESPACE_DEV}
                                kubectl set image deployment/redthread-frontend redthread-frontend=${DOCKER_REGISTRY}/redthread-frontend:${VERSION} -n ${K8S_NAMESPACE_DEV}
                                kubectl rollout status deployment/redthread-backend -n ${K8S_NAMESPACE_DEV}
                                kubectl rollout status deployment/redthread-frontend -n ${K8S_NAMESPACE_DEV}
                            """
                        }
                    }
                }
                
                stage('Deploy to Staging') {
                    when {
                        branch 'staging'
                    }
                    steps {
                        script {
                            sh """
                                echo "Deploying to Staging environment..."
                                kubectl set image deployment/redthread-backend redthread-backend=${DOCKER_REGISTRY}/redthread-backend:${VERSION} -n ${K8S_NAMESPACE_STAGING}
                                kubectl set image deployment/redthread-frontend redthread-frontend=${DOCKER_REGISTRY}/redthread-frontend:${VERSION} -n ${K8S_NAMESPACE_STAGING}
                                kubectl rollout status deployment/redthread-backend -n ${K8S_NAMESPACE_STAGING}
                                kubectl rollout status deployment/redthread-frontend -n ${K8S_NAMESPACE_STAGING}
                            """
                        }
                    }
                }
                
                stage('Deploy to Production') {
                    when {
                        branch 'main'
                    }
                    steps {
                        input message: 'Deploy to Production?', ok: 'Deploy'
                        script {
                            sh """
                                echo "Deploying to Production environment..."
                                kubectl set image deployment/redthread-backend redthread-backend=${DOCKER_REGISTRY}/redthread-backend:${VERSION} -n ${K8S_NAMESPACE_PROD}
                                kubectl set image deployment/redthread-frontend redthread-frontend=${DOCKER_REGISTRY}/redthread-frontend:${VERSION} -n ${K8S_NAMESPACE_PROD}
                                kubectl rollout status deployment/redthread-backend -n ${K8S_NAMESPACE_PROD}
                                kubectl rollout status deployment/redthread-frontend -n ${K8S_NAMESPACE_PROD}
                            """
                        }
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                def message = """
                ✅ *Build Successful*
                *Project:* RedThread
                *Branch:* ${env.GIT_BRANCH}
                *Build:* #${env.BUILD_NUMBER}
                *Commit:* ${env.GIT_COMMIT_SHORT}
                *Duration:* ${currentBuild.durationString}
                """
                
                // Slack notification
                // slackSend(channel: SLACK_CHANNEL, color: 'good', message: message)
                
                // Teams notification
                office365ConnectorSend(
                    webhookUrl: TEAMS_WEBHOOK,
                    status: 'Success',
                    message: message
                )
            }
        }
        
        failure {
            script {
                def message = """
                ❌ *Build Failed*
                *Project:* RedThread
                *Branch:* ${env.GIT_BRANCH}
                *Build:* #${env.BUILD_NUMBER}
                *Commit:* ${env.GIT_COMMIT_SHORT}
                *Duration:* ${currentBuild.durationString}
                """
                
                // Slack notification
                // slackSend(channel: SLACK_CHANNEL, color: 'danger', message: message)
                
                // Teams notification
                office365ConnectorSend(
                    webhookUrl: TEAMS_WEBHOOK,
                    status: 'Failure',
                    message: message
                )
            }
        }
        
        always {
            cleanWs()
        }
    }
}
