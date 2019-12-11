node{
	stage('git checkout'){
		git credentialsId: 'GIT-CREDS', url: 'https://github.com/cafienne/cafienne-ide.git', branch: env.BRANCH_NAME
	}
	stage('pull latest images'){
		sh 'docker-compose -f ../../../../../home/cafienneCI/Work/cafienne-docker/cafienne-docker.yml pull'
	}
	stage('Install packages'){
	    sh 'chmod -R 777 .'
		sh 'npm install'
		sh 'npm install bower'
		sh 'bower install'
	}
	stage('Build IDE docker image'){
		sh 'docker build -t cafienne/ide:latest .'
	}
	stage('Up Cafienne containers'){
		sh 'sysctl -w vm.max_map_count=262144'
		sh 'docker-compose -f ../../../../../home/cafienneCI/Work/cafienne-docker/cafienne-docker.yml up -d'
		sh 'sleep 60'
	}
	parallel Helloworld_Test: {
		stage('Test docker image by Helloworld SoapUI'){
		    sh '../../../../../home/cafienneCI/SmartBear/SoapUI-5.5.0/bin/testrunner.sh -s"Hello World" -c"Hello World" "../../../../../home/cafienneCI/Work/soap-ui/Cafienne Test Cases.xml"'
		}
	}, TravellRequest_Test: {
		stage('Test docker image by TravelRequest SoapUI'){
		    sh '../../../../../home/cafienneCI/SmartBear/SoapUI-5.5.0/bin/testrunner.sh -s"Requestor travels to Brussels" -c"Requestor travels to Brussels" "../../../../../home/cafienneCI/Work/soap-ui/Cafienne Test Cases.xml"'
		}
	}
	stage('Stop containers'){
		sh 'docker-compose -f ../../../../../home/cafienneCI/Work/cafienne-docker/cafienne-docker.yml stop'
	}
	stage('push docker image for master'){
		if (env.BRANCH_NAME == 'master'){
			echo "pushing docker image to Dockerhub"
			withCredentials([string(credentialsId: 'DOCKERUSER', variable: 'dockeruser'), string(credentialsId: 'DOCKERPWD', variable: 'dockerpwd')]) {
				sh "docker login -u ${DOCKERUSER} -p ${DOCKERPWD}"
				sh 'docker push cafienne/ide:latest'
			}
		}
		else{
			echo "Not pushing docker image to Dockerhub"
		}
	}
}