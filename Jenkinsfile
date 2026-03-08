pipeline {
    agent any

    environment {
        // Asegúrate de crear esta credencial en Jenkins con el ID 'findsmart-backend-env'
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
                    // Verificamos compatibilidad de comandos docker
                    def dockerCmd = sh(script: "docker compose version", returnStatus: true) == 0 ? "docker compose" : "docker-compose"
                    sh "${dockerCmd} up -d --build"
                }
            }
        }
    }

    post {
        always {
            sh 'rm -f .env'
        }
        success {
            echo '¡Backend de FindSmart desplegado en el puerto 4000!'
        }
    }
}