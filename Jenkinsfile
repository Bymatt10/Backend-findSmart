pipeline {
    agent any

    environment {
        ENV_FILE = credentials('findsmart-backend-env')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Preparar Configuración') {
            steps {
                sh 'cp $ENV_FILE .env'
            }
        }

        stage('Desplegar API') {
            steps {
                script {
                    def dockerCmd = sh(script: "docker compose version", returnStatus: true) == 0 ? "docker compose" : "docker-compose"
                    sh "${dockerCmd} up -d --build"
                }
            }
        }
    }

    post {
        always {
            // Limpieza simple del archivo .env
            sh 'rm -f .env'
        }
        success {
            echo '¡Backend de FindSmart desplegado con éxito!'
        }
    }
}